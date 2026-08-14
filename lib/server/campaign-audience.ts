import "server-only";
import { resolveSmsAudience, type AudienceContact, type AudienceFilters } from "@/lib/contacts";
import { adminDb } from "./firebase-admin";

export async function loadCampaignAudience(filters: AudienceFilters) {
  const snapshot = await adminDb.collection("feedback_contacts").limit(5_001).get();
  if (snapshot.size > 5_000) throw new Error("AUDIENCE_LIMIT");
  const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AudienceContact));
  const optedOutIds = new Set<string>();
  for (let offset = 0; offset < contacts.length; offset += 400) {
    const group = contacts.slice(offset, offset + 400);
    const documents = await adminDb.getAll(...group.map(contact => adminDb.collection("sms_opt_outs").doc(contact.id)));
    documents.forEach((document, index) => { if (document.exists) optedOutIds.add(group[index].id); });
  }
  return resolveSmsAudience(contacts, filters, optedOutIds);
}
