import { deduplicateRecipients, normalizeGhanaPhone } from "@/lib/sms";

export const campaignSources = ["all_contacts", "staff", "health_screening", "facility", "outpatient", "reception", "laboratory", "pharmacy", "custom_list", "other"] as const;
export const defaultFeedbackMessage = "Thank you for visiting Satellite General Hospital. We value your experience. Please take a minute or two to share your feedback with us: [SURVEY LINK]";

export function parseRecipientImport(value: string) {
  const entries = value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
  const recipients = deduplicateRecipients(entries);
  return { recipients, invalidCount: entries.filter((item) => !normalizeGhanaPhone(item)).length, duplicateCount: entries.length - entries.filter((item) => !normalizeGhanaPhone(item)).length - recipients.length };
}
