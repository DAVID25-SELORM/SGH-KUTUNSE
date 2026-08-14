import "server-only";
import { normalizeGhanaPhone } from "@/lib/sms";
import { hasSmsConsentForPurpose } from "@/lib/contacts";
import { adminDb } from "./firebase-admin";

export const SCREENING_CONSENT_SCOPES = ["feedback_request", "health_screening_followup"] as const;

export async function previewScreeningConsentMigration() {
  const snapshot = await adminDb.collection("feedback_contacts").limit(5_001).get();
  if (snapshot.size > 5_000) throw new Error("CONTACT_LIMIT");
  const contacts = snapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref, data: doc.data() }));
  const optedOutIds = new Set<string>();
  for (let offset = 0; offset < contacts.length; offset += 400) {
    const group = contacts.slice(offset, offset + 400);
    const optOuts = await adminDb.getAll(...group.map(contact => adminDb.collection("sms_opt_outs").doc(contact.id)));
    optOuts.forEach((doc, index) => { if (doc.exists) optedOutIds.add(group[index].id); });
  }
  const seen = new Set<string>();
  const candidates: typeof contacts = [];
  let invalidNumbers = 0, duplicates = 0, doNotContact = 0, existingOptOuts = 0, inactive = 0, alreadyScoped = 0;
  for (const contact of contacts) {
    const data = contact.data;
    if (data.status !== "active") { inactive++; continue; }
    const phone = normalizeGhanaPhone(String(data.normalizedPhone ?? data.phone ?? ""));
    if (!phone) { invalidNumbers++; continue; }
    if (seen.has(phone)) { duplicates++; continue; }
    seen.add(phone);
    if (data.doNotContact === true) { doNotContact++; continue; }
    if (optedOutIds.has(contact.id) || data.smsConsentStatus === "opted_out") { existingOptOuts++; continue; }
    if (hasSmsConsentForPurpose(data, "feedback_request") && hasSmsConsentForPurpose(data, "health_screening_followup")) { alreadyScoped++; continue; }
    candidates.push(contact);
  }
  return {
    summary: { totalContacts: contacts.length, contactsToMarkConsented: candidates.length, existingOptOuts, doNotContact, duplicates, invalidNumbers, inactive, alreadyScoped, consentSource: "health_screening", consentScope: [...SCREENING_CONSENT_SCOPES] },
    candidates,
  };
}
