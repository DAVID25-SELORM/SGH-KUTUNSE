import { FieldValue } from "firebase-admin/firestore";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { campaignLink, campaignSendSchema } from "@/lib/feedback-campaigns";
import { normalizeGhanaPhone } from "@/lib/sms";
import type { SmsResult } from "@/lib/sms";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";
import { getSmsProvider } from "@/lib/server/sms";

export const maxDuration = 300;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_sms");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, campaignSendSchema);
  if (parsed.error) return parsed.error;
  const { id } = await context.params;
  const ref = adminDb.collection("feedback_campaigns").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return NextResponse.json({ ok: false }, { status: 404 });
  const campaign = snapshot.data()!;
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
  if (campaign.testVerified !== true || campaign.status !== "test_verified")
    return NextResponse.json({ ok: false, message: "Bulk SMS unlocks automatically after the test survey is submitted successfully." }, { status: 409 });
  const message = String(campaign.message).replace("[SURVEY LINK]", campaignLink(id, String(campaign.source)));
  const recipients = await ref.collection("recipients").where("status", "==", "queued").limit(5_000).get();
  const expected = Number(campaign.queuedCount ?? recipients.size);
  if (parsed.data.confirmation !== `SEND ${expected}`) return NextResponse.json({ ok: false, message: `Type SEND ${expected} to confirm this batch.` }, { status: 400 });
  if (recipients.empty) return NextResponse.json({ ok: false, message: "There are no queued recipients." }, { status: 409 });
  const claimed = await adminDb.runTransaction(async (transaction) => {
    const fresh = await transaction.get(ref);
    if (fresh.data()?.status !== "test_verified" || fresh.data()?.testVerified !== true) return false;
    transaction.update(ref, { status: "sending", processingBy: actor.uid, bulkApprovedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return true;
  });
  if (!claimed) return NextResponse.json({ ok: false, message: "This campaign was already started." }, { status: 409 });
  await writeAudit(actor.uid, "feedback_campaign.bulk_approved", "feedback_campaign", id, { recipientCount: String(recipients.size) });
  const results: SmsResult[] = [];
  for (let offset = 0; offset < recipients.size; offset += 200) {
    const chunk = recipients.docs.slice(offset, offset + 200);
    results.push(...await provider.sendBatch(chunk.map((doc) => ({ to: String(doc.data().phone), message, idempotencyKey: `${id}-${doc.id}` }))));
  }
  const mocked = results.filter((result) => result.status === "mocked").length;
  const failed = results.filter((result) => result.status === "failed").length;
  for (let offset = 0; offset < recipients.size; offset += 200) {
    const writeBatch = adminDb.batch();
    recipients.docs.slice(offset, offset + 200).forEach((doc, index) => { const result = results[offset + index]; writeBatch.update(doc.ref, { status: result.status, providerId: result.providerId, attemptCount: FieldValue.increment(1), attemptedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }); if (result.status !== "failed") writeBatch.set(adminDb.collection("feedback_contacts").doc(doc.id), { lastContactedAt: FieldValue.serverTimestamp(), lastCampaignId: id, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); });
    await writeBatch.commit();
  }
  const finalStatus = failed === results.length ? "failed" : failed ? "partially_failed" : "completed";
  await ref.update({ status: finalStatus, mockedCount: FieldValue.increment(mocked), acceptedCount: FieldValue.increment(results.length - failed - mocked), failedCount: FieldValue.increment(failed), queuedCount: FieldValue.increment(-results.length), sentAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  await writeAudit(actor.uid, "feedback_campaign.bulk_sent", "feedback_campaign", id, { recipientCount: String(results.length), failedCount: String(failed), providerMode: provider.mode });
  return NextResponse.json({ ok: true, processed: results.length, failed, status: finalStatus, mode: provider.mode });
}
