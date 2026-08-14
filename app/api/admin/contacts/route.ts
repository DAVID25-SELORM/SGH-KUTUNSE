import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { contactSchema, prepareContact } from "@/lib/contacts";
import { recipientKey } from "@/lib/feedback-campaigns";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("contacts_manage"); if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, contactSchema); if (parsed.error) return parsed.error;
  try {
    const data = prepareContact(parsed.data); const id = recipientKey(data.normalizedPhone); const ref = adminDb.collection("feedback_contacts").doc(id); const current = await ref.get();
    if (current.exists) return NextResponse.json({ ok: false, message: "That phone number already belongs to an existing contact.", id }, { status: 409 });
    await ref.create({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), createdBy: actor.uid, updatedBy: actor.uid });
    await writeAudit(actor.uid, "contact.created", "contact", id, { source: data.source });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) { return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Contact could not be saved." }, { status: 400 }); }
}
