import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { campaignLink, campaignSendSchema } from "@/lib/feedback-campaigns";
import { normalizeGhanaPhone } from "@/lib/sms";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";
import { getSmsProvider } from "@/lib/server/sms";

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
  const message = String(campaign.message).replace("[SURVEY LINK]", campaignLink(id, String(campaign.source)));
  if (parsed.data.action === "test") {
    const phone = normalizeGhanaPhone(parsed.data.testPhone ?? "");
    if (!phone || parsed.data.confirmation !== "SEND TEST") return NextResponse.json({ ok: false, message: "Enter a valid Ghana number and type SEND TEST." }, { status: 400 });
    const result = await provider.sendMessage(phone, message, `test-${id}-${Date.now()}`);
    await writeAudit(actor.uid, `feedback_campaign.${provider.mode}_test`, "feedback_campaign", id);
    return NextResponse.json({ ok: true, status: result.status, mode: provider.mode });
  }
  if (provider.mode === "live" && process.env.SMS_BULK_ENABLED !== "true")
    return NextResponse.json({ ok: false, message: "Live bulk SMS remains locked until the handset test and survey response are verified." }, { status: 409 });
  const recipients = await ref.collection("recipients").where("status", "==", "queued").limit(400).get();
  const expected = Number(campaign.queuedCount ?? recipients.size);
  if (parsed.data.confirmation !== `SEND ${expected}`) return NextResponse.json({ ok: false, message: `Type SEND ${expected} to confirm this batch.` }, { status: 400 });
  if (recipients.empty) return NextResponse.json({ ok: false, message: "There are no queued recipients." }, { status: 409 });
  const claimed = await adminDb.runTransaction(async (transaction) => {
    const fresh = await transaction.get(ref);
    if (!["ready", "mock_failed", "sandbox_failed"].includes(String(fresh.data()?.status))) return false;
    transaction.update(ref, { status: `${provider.mode}_processing`, processingBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
    return true;
  });
  if (!claimed) return NextResponse.json({ ok: false, message: "This campaign was already started." }, { status: 409 });
  const results = await provider.sendBatch(recipients.docs.map((doc) => ({ to: String(doc.data().phone), message, idempotencyKey: `${id}-${doc.id}` })));
  const mocked = results.filter((result) => result.status === "mocked").length;
  const failed = results.filter((result) => result.status === "failed").length;
  const batch = adminDb.batch();
  recipients.docs.forEach((doc, index) => batch.update(doc.ref, { status: results[index].status, providerId: results[index].providerId, attemptCount: FieldValue.increment(1), attemptedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }));
  batch.update(ref, { status: `${provider.mode}_complete`, mockedCount: FieldValue.increment(mocked), failedCount: FieldValue.increment(failed), queuedCount: FieldValue.increment(-results.length), updatedAt: FieldValue.serverTimestamp() });
  await batch.commit();
  await writeAudit(actor.uid, `feedback_campaign.${provider.mode}_batch_started`, "feedback_campaign", id, { recipientCount: String(results.length) });
  return NextResponse.json({ ok: true, processed: results.length, mode: provider.mode });
}
