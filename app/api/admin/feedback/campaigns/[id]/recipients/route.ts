import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { parseRecipientImport, recipientImportSchema, recipientKey } from "@/lib/feedback-campaigns";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";

function maskPhone(phone: string) {
  const normalized = phone.replace(/\s/g, "");
  if (normalized.length < 7) return "Hidden";
  return `${normalized.slice(0, 4)}••••${normalized.slice(-4)}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await verifyAdminRequest("feedback_campaigns");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await context.params;
  const campaignRef = adminDb.collection("feedback_campaigns").doc(id);
  if (!(await campaignRef.get()).exists)
    return NextResponse.json({ ok: false, message: "Campaign not found." }, { status: 404 });
  const snapshot = await campaignRef
    .collection("recipients")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  return NextResponse.json({
    ok: true,
    recipients: snapshot.docs.map((document) => ({
      id: document.id,
      phone: maskPhone(String(document.data().phone ?? "")),
      status: String(document.data().status ?? "unknown"),
      attemptCount: Number(document.data().attemptCount ?? 0),
    })),
    limited: snapshot.size === 100,
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_campaigns");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, recipientImportSchema);
  if (parsed.error) return parsed.error;
  const { id } = await context.params;
  const campaignRef = adminDb.collection("feedback_campaigns").doc(id);
  const campaign = await campaignRef.get();
  if (!campaign.exists) return NextResponse.json({ ok: false, message: "Campaign not found." }, { status: 404 });
  if (!["draft", "ready"].includes(String(campaign.data()?.status))) return NextResponse.json({ ok: false, message: "Recipients cannot be changed after batch processing starts." }, { status: 409 });
  const imported = parseRecipientImport(parsed.data.recipients);
  if (!imported.recipients.length) return NextResponse.json({ ok: false, message: "No valid Ghana phone numbers were found." }, { status: 400 });
  if (imported.recipients.length > 400) return NextResponse.json({ ok: false, message: "Import no more than 400 unique recipients at a time." }, { status: 413 });
  if (Number(campaign.data()?.recipientCount ?? 0) + imported.recipients.length > 5_000) return NextResponse.json({ ok: false, message: "This import could exceed the 5,000-recipient campaign limit." }, { status: 413 });
  const refs = imported.recipients.map((phone) => campaignRef.collection("recipients").doc(recipientKey(phone)));
  const [existing, optOuts] = await Promise.all([adminDb.getAll(...refs), adminDb.getAll(...imported.recipients.map((phone) => adminDb.collection("sms_opt_outs").doc(recipientKey(phone))))]);
  const batch = adminDb.batch();
  let added = 0, optedOut = 0, existingCount = 0;
  imported.recipients.forEach((phone, index) => {
    if (existing[index].exists) { existingCount++; return; }
    const isOptedOut = optOuts[index].exists;
    if (isOptedOut) optedOut++;
    batch.create(refs[index], { phone, phoneHash: recipientKey(phone), status: isOptedOut ? "opted_out" : "queued", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), attemptCount: 0 });
    added++;
  });
  batch.set(campaignRef, { status: "ready", recipientCount: FieldValue.increment(added), queuedCount: FieldValue.increment(added - optedOut), optedOutCount: FieldValue.increment(optedOut), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await batch.commit();
  await writeAudit(actor.uid, "feedback_campaign.recipients_imported", "feedback_campaign", id, { added: String(added), duplicates: String(existingCount + imported.duplicateCount), invalid: String(imported.invalidCount), optedOut: String(optedOut) });
  return NextResponse.json({ ok: true, added, duplicateCount: existingCount + imported.duplicateCount, invalidCount: imported.invalidCount, optedOut });
}
