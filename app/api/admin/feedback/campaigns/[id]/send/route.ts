import { FieldValue } from "firebase-admin/firestore";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { campaignAudienceSchema, campaignLink, campaignSendSchema } from "@/lib/feedback-campaigns";
import { hasSmsConsentForPurpose, type SmsConsentScope } from "@/lib/contacts";
import { normalizeGhanaPhone } from "@/lib/sms";
import type { SmsResult } from "@/lib/sms";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";
import { getSmsProvider } from "@/lib/server/sms";
import { verifyScheduledTaskRequest } from "@/lib/server/sms-scheduler";
import { loadCampaignAudience } from "@/lib/server/campaign-audience";
import { getSmsPolicy } from "@/lib/server/sms-settings";
import { isDateWithinSmsPolicy, smsPolicyRestrictionMessage } from "@/lib/sms-policy";

export const maxDuration = 300;

async function recalculateEligible(ref: FirebaseFirestore.DocumentReference, purpose: SmsConsentScope, allowedContactIds?: Set<string>) {
  const snapshot = await ref.collection("recipients").where("status", "==", "queued").limit(5_001).get();
  if (snapshot.size > 5_000) throw new Error("AUDIENCE_LIMIT");
  const eligible: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  const excluded: Array<{ doc: FirebaseFirestore.QueryDocumentSnapshot; status: "invalid" | "opted_out" | "skipped" }> = [];
  for (let offset = 0; offset < snapshot.size; offset += 400) {
    const group = snapshot.docs.slice(offset, offset + 400);
    const [contacts, optOuts] = await Promise.all([
      adminDb.getAll(...group.map((doc) => adminDb.collection("feedback_contacts").doc(doc.id))),
      adminDb.getAll(...group.map((doc) => adminDb.collection("sms_opt_outs").doc(doc.id))),
    ]);
    group.forEach((doc, index) => {
      if (allowedContactIds && !allowedContactIds.has(doc.id)) excluded.push({ doc, status: "skipped" });
      else if (!normalizeGhanaPhone(String(doc.data().phone ?? ""))) excluded.push({ doc, status: "invalid" });
      else if (optOuts[index].exists) excluded.push({ doc, status: "opted_out" });
      else if (contacts[index].exists && (contacts[index].data()?.status !== "active" || contacts[index].data()?.doNotContact === true || !hasSmsConsentForPurpose(contacts[index].data()!, purpose))) excluded.push({ doc, status: "skipped" });
      else eligible.push(doc);
    });
  }
  for (let offset = 0; offset < excluded.length; offset += 450) {
    const batch = adminDb.batch();
    excluded.slice(offset, offset + 450).forEach(({ doc, status }) => batch.update(doc.ref, { status, exclusionReason: status, updatedAt: FieldValue.serverTimestamp() }));
    await batch.commit();
  }
  await ref.set({ finalEligibleCount: eligible.length, finalExcludedCount: excluded.length, queuedCount: eligible.length, eligibilityCheckedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { eligible, excluded };
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const taskActor = await verifyScheduledTaskRequest(request);
  if (!taskActor && !isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = taskActor ?? await verifyAdminRequest("feedback_sms");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, campaignSendSchema);
  if (parsed.error) return parsed.error;
  const { id } = await context.params;
  const ref = adminDb.collection("feedback_campaigns").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return NextResponse.json({ ok: false }, { status: 404 });
  const campaign = snapshot.data()!;
  const isScheduled = parsed.data.action === "scheduled";
  if (isScheduled !== Boolean(taskActor)) return NextResponse.json({ ok: false }, { status: 403 });
  if (isScheduled) {
    const scheduledAt = campaign.scheduledAt?.toDate?.();
    const stale = campaign.status !== "scheduled" || parsed.data.scheduleGeneration !== Number(campaign.scheduleGeneration) || taskActor?.task !== campaign.scheduledTaskName;
    if (stale) return NextResponse.json({ ok: true, ignored: true, reason: "stale_or_cancelled_schedule" });
    if (!(scheduledAt instanceof Date) || scheduledAt.getTime() > Date.now() + 60_000) return NextResponse.json({ ok: false, message: "Scheduled campaign is not due." }, { status: 409 });
  }
  const provider = getSmsProvider();
  if (parsed.data.action === "test") {
    const phone = normalizeGhanaPhone(parsed.data.testPhone ?? "");
    if (!phone || parsed.data.confirmation !== "SEND TEST") return NextResponse.json({ ok: false, message: "Enter a valid Ghana number and type SEND TEST." }, { status: 400 });
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const testLink = campaignLink(id, String(campaign.source), token);
    const message = String(campaign.message).replace("[SURVEY LINK]", testLink);
    const result = await provider.sendMessage(phone, message, `test-${id}-${Date.now()}`);
    if (result.status === "failed") return NextResponse.json({ ok: false, message: "The test SMS was not accepted by Arkesel." }, { status: 502 });
    const batch = adminDb.batch();
    batch.set(adminDb.collection("feedback_test_tokens").doc(tokenHash), { campaignId: id, recipientHash: createHash("sha256").update(phone).digest("hex"), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), createdAt: FieldValue.serverTimestamp(), openedAt: null, submittedAt: null, used: false });
    batch.update(ref, { status: "test_sent", testSmsAcceptedAt: FieldValue.serverTimestamp(), testLinkOpenedAt: null, testFeedbackSubmittedAt: null, testVerifiedAt: null, testVerified: false, updatedAt: FieldValue.serverTimestamp() });
    await batch.commit();
    await writeAudit(actor.uid, `feedback_campaign.${provider.mode}_test`, "feedback_campaign", id);
    return NextResponse.json({ ok: true, status: result.status, mode: provider.mode });
  }
  if (parsed.data.action === "batch" || isScheduled) {
    const currentPolicy = await getSmsPolicy();
    if (!isDateWithinSmsPolicy(new Date(), currentPolicy)) {
      if (isScheduled) {
        await ref.update({ status: "scheduled_send_blocked", scheduledSendBlockedAt: FieldValue.serverTimestamp(), scheduledSendBlockedReason: "outside_current_sending_window", updatedAt: FieldValue.serverTimestamp() });
        await writeAudit(actor.uid, "feedback_campaign.scheduled_send_blocked", "feedback_campaign", id, { reason: "outside_current_sending_window", startTime: currentPolicy.sendingStartTime, endTime: currentPolicy.sendingEndTime, timezone: currentPolicy.timezone });
        return NextResponse.json({ ok: true, status: "scheduled_send_blocked", reason: "outside_current_sending_window", message: smsPolicyRestrictionMessage(currentPolicy) });
      }
      return NextResponse.json({ ok: false, message: smsPolicyRestrictionMessage(currentPolicy) }, { status: 409 });
    }
  }
  const currentLease = campaign.processingLeaseUntil?.toDate?.();
  const recoveryWindowOpen = campaign.status === "sending" && currentLease instanceof Date && currentLease.getTime() <= Date.now();
  if (campaign.testVerified !== true || (!isScheduled && campaign.status !== "test_verified" && !recoveryWindowOpen))
    return NextResponse.json({ ok: false, message: "Bulk SMS unlocks automatically after the test survey is submitted successfully." }, { status: 409 });
  const message = String(campaign.message).replace("[SURVEY LINK]", campaignLink(id, String(campaign.source)));
  let recalculated;
  try {
    let allowedContactIds: Set<string> | undefined;
    if (campaign.source !== "custom_list") {
      const audience = campaignAudienceSchema.parse(campaign.audience);
      const currentAudience = await loadCampaignAudience(audience);
      allowedContactIds = new Set(currentAudience.eligibleContacts.map(contact => contact.id));
    }
    recalculated = await recalculateEligible(ref, String(campaign.audience?.purpose ?? "feedback_request") as SmsConsentScope, allowedContactIds);
  } catch (error) {
    if (error instanceof Error && error.message === "AUDIENCE_LIMIT") return NextResponse.json({ ok: false, message: "This campaign exceeds the 5,000-recipient limit." }, { status: 413 });
    if (isScheduled) {
      await ref.update({ status: "failed", scheduledSendFailedAt: FieldValue.serverTimestamp(), scheduledSendError: "pre_send_validation_failed", updatedAt: FieldValue.serverTimestamp() });
      await writeAudit(actor.uid, "feedback_campaign.scheduled_send_failed", "feedback_campaign", id, { errorClass: "pre_send_validation_failed" });
      return NextResponse.json({ ok: false, message: "Scheduled send could not start." }, { status: 500 });
    }
    throw error;
  }
  const expected = recalculated.eligible.length;
  if (parsed.data.action === "preview") return NextResponse.json({ ok: true, eligibleCount: expected, excludedCount: recalculated.excluded.length });
  if (!isScheduled && parsed.data.confirmation !== `SEND ${expected}`) return NextResponse.json({ ok: false, message: `Type SEND ${expected} to confirm this batch.` }, { status: 400 });
  if (!recalculated.eligible.length) {
    if (isScheduled) {
      await ref.update({ status: "failed", finalEligibleCount: 0, excludedSinceScheduling: Number(campaign.originalEligibleCount ?? 0), scheduledSendFailedAt: FieldValue.serverTimestamp(), scheduledSendError: "no_eligible_recipients", updatedAt: FieldValue.serverTimestamp() });
      await writeAudit(actor.uid, "feedback_campaign.scheduled_send_failed", "feedback_campaign", id, { errorClass: "no_eligible_recipients" });
      return NextResponse.json({ ok: true, status: "failed", message: "Scheduled send could not start because no eligible recipients remain." });
    }
    return NextResponse.json({ ok: false, message: "There are no eligible recipients." }, { status: 409 });
  }
  const claimed = await adminDb.runTransaction(async (transaction) => {
    const fresh = await transaction.get(ref);
    const status = String(fresh.data()?.status ?? "");
    const leaseUntil = fresh.data()?.processingLeaseUntil?.toDate?.();
    const recoverable = status === "sending" && leaseUntil instanceof Date && leaseUntil.getTime() <= Date.now();
    const scheduledMatch = isScheduled && status === "scheduled" && fresh.data()?.scheduleGeneration === parsed.data.scheduleGeneration && fresh.data()?.scheduledTaskName === taskActor?.task;
    if ((!scheduledMatch && status !== "test_verified" && !recoverable) || fresh.data()?.testVerified !== true) return false;
    transaction.update(ref, { status: "sending", processingBy: actor.uid, processingLeaseUntil: new Date(Date.now() + 10 * 60 * 1000), bulkApprovedAt: FieldValue.serverTimestamp(), finalEligibleCount: expected, excludedSinceScheduling: Math.max(0, Number(fresh.data()?.originalEligibleCount ?? expected) - expected), updatedAt: FieldValue.serverTimestamp() });
    return true;
  });
  if (!claimed) return NextResponse.json({ ok: false, message: "This campaign was already started." }, { status: 409 });
  const ambiguous = await ref.collection("recipients").where("status", "==", "sending").limit(5_000).get();
  for (let offset = 0; offset < ambiguous.size; offset += 450) { const batch = adminDb.batch(); ambiguous.docs.slice(offset, offset + 450).forEach((doc) => batch.update(doc.ref, { status: "interrupted_delivery_unknown", errorClass: "interrupted_delivery_unknown", updatedAt: FieldValue.serverTimestamp() })); await batch.commit(); }
  await writeAudit(actor.uid, isScheduled ? "feedback_campaign.scheduled_send_started" : "feedback_campaign.bulk_approved", "feedback_campaign", id, { recipientCount: String(recalculated.eligible.length) });
  const results: SmsResult[] = [];
  for (let offset = 0; offset < recalculated.eligible.length; offset += 200) {
    const chunk = recalculated.eligible.slice(offset, offset + 200);
    const claimBatch = adminDb.batch(); chunk.forEach((doc) => claimBatch.update(doc.ref, { status: "sending", attemptCount: FieldValue.increment(1), attemptedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })); await claimBatch.commit();
    results.push(...await provider.sendBatch(chunk.map((doc) => ({ to: String(doc.data().phone), message, idempotencyKey: `${id}-${doc.id}` }))));
  }
  const mocked = results.filter((result) => result.status === "mocked").length;
  const failed = results.filter((result) => result.status === "failed").length;
  for (let offset = 0; offset < recalculated.eligible.length; offset += 200) {
    const writeBatch = adminDb.batch();
    recalculated.eligible.slice(offset, offset + 200).forEach((doc, index) => { const result = results[offset + index]; const status = result.status === "accepted" ? "sent" : result.status; writeBatch.update(doc.ref, { status, providerId: result.providerId, providerStatus: result.status, updatedAt: FieldValue.serverTimestamp() }); if (result.status !== "failed") writeBatch.set(adminDb.collection("feedback_contacts").doc(doc.id), { lastContactedAt: FieldValue.serverTimestamp(), lastCampaignId: id, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); });
    await writeBatch.commit();
  }
  const finalStatus = failed === results.length && !ambiguous.size ? "failed" : failed || ambiguous.size ? "partially_failed" : "completed";
  await ref.update({ status: finalStatus, mockedCount: FieldValue.increment(mocked), acceptedCount: FieldValue.increment(results.length - failed - mocked), failedCount: FieldValue.increment(failed), unknownCount: FieldValue.increment(ambiguous.size), queuedCount: 0, processingLeaseUntil: null, sentAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  await writeAudit(actor.uid, "feedback_campaign.bulk_sent", "feedback_campaign", id, { recipientCount: String(results.length), failedCount: String(failed), unknownCount: String(ambiguous.size), providerMode: provider.mode });
  return NextResponse.json({ ok: true, processed: results.length, failed, unknown: ambiguous.size, status: finalStatus, mode: provider.mode });
}
