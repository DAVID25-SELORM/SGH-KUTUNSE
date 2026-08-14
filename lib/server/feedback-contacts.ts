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

export async function ensureLegacyCampaignContacts() {
  const campaigns = await adminDb.collection("feedback_campaigns").limit(100).get();
  const recipientSets = await Promise.all(campaigns.docs.map(doc => doc.ref.collection("recipients").limit(5000).get()));
  const found = new Map<string, { phone: string; source: string }>();
  recipientSets.forEach((snapshot, index) => snapshot.docs.forEach(document => {
    const phone = normalizeGhanaPhone(String(document.data().phone ?? ""));
    if (!phone) return;
    const id = recipientKey(phone);
    if (!found.has(id)) found.set(id, { phone, source: String(campaigns.docs[index].data().source ?? "other") });
  }));
  const entries = [...found.entries()];
  if (!entries.length) return;
  const existing = await adminDb.getAll(...entries.map(([id]) => adminDb.collection("feedback_contacts").doc(id)));
  const missing = entries.filter((_, index) => !existing[index].exists);
  if (!missing.length) return;
  for (let offset = 0; offset < missing.length; offset += 400) {
    const batch = adminDb.batch();
    missing.slice(offset, offset + 400).forEach(([id, { phone, source }]) => batch.create(adminDb.collection("feedback_contacts").doc(id), { fullName: "", phone, normalizedPhone: phone, phoneHash: id, email: "", gender: "", dateOfBirth: "", age: null, ageGroup: "", source: source === "all_contacts" || source === "custom_list" ? "other" : source, sources: [source], facility: "", group: "", tags: [], smsOptIn: false, emailOptIn: false, doNotContact: false, notes: "", status: "active", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), createdBy: "system:legacy-contact-migration", updatedBy: "system:legacy-contact-migration" }));
    await batch.commit();
  }
  await adminDb.collection("audit_logs").add({ actorUid: "system:legacy-contact-migration", action: "contact.imported", entityType: "contact", entityId: "legacy-campaigns", metadata: { added: String(missing.length) }, timestamp: FieldValue.serverTimestamp() });
}
