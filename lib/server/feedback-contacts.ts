import "server-only";

import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { recipientKey } from "@/lib/feedback-campaigns";
import { normalizeGhanaPhone } from "@/lib/sms";
import { adminDb } from "./firebase-admin";

const approvedStaffPhones = [
  "+233 59 241 6792",
  "+233 50 164 9768",
  "+233 24 487 5413",
  "+233 24 920 5541",
  "+233 20 621 1102",
  "0247654381",
];

export async function ensureApprovedStaffContacts() {
  const contacts = approvedStaffPhones.map(phone => normalizeGhanaPhone(phone)).filter((phone): phone is string => Boolean(phone));
  const refs = contacts.map(phone => adminDb.collection("feedback_contacts").doc(recipientKey(phone)));
  const existing = await adminDb.getAll(...refs);
  const missing = existing.map((document, index) => document.exists ? null : { ref: refs[index], phone: contacts[index] }).filter((item): item is { ref: DocumentReference; phone: string } => Boolean(item));
  if (!missing.length) return;
  const batch = adminDb.batch();
  missing.forEach(({ ref, phone }) => batch.create(ref, { name: "", phone, phoneHash: ref.id, source: "staff", status: "active", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), createdBy: "system:approved-staff-seed", updatedBy: "system:approved-staff-seed" }));
  const audit = adminDb.collection("audit_logs").doc();
  batch.create(audit, { actorUid: "system:approved-staff-seed", action: "feedback_contacts.staff_seeded", entityType: "feedback_contact", entityId: "approved-staff", metadata: { added: String(missing.length) }, timestamp: FieldValue.serverTimestamp() });
  await batch.commit();
}
