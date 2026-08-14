import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { feedbackContactSchema, recipientKey } from "@/lib/feedback-campaigns";
import { normalizeGhanaPhone } from "@/lib/sms";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_campaigns");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, feedbackContactSchema);
  if (parsed.error) return parsed.error;
  const phone = normalizeGhanaPhone(parsed.data.phone);
  if (!phone) return NextResponse.json({ ok: false, message: "Enter a valid Ghana mobile number." }, { status: 400 });
  const id = recipientKey(phone);
  const ref = adminDb.collection("feedback_contacts").doc(id);
  const existing = await ref.get();
  await ref.set({
    name: parsed.data.name,
    phone,
    phoneHash: id,
    source: parsed.data.source,
    status: "active",
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.uid,
    ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp(), createdBy: actor.uid }),
  }, { merge: true });
  await writeAudit(actor.uid, existing.exists ? "feedback_contact.updated" : "feedback_contact.created", "feedback_contact", id, { source: parsed.data.source });
  return NextResponse.json({ ok: true, id, duplicate: existing.exists });
}
