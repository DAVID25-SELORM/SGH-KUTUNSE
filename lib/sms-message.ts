export const campaignPurposes = ["feedback_request", "health_screening_followup", "service_followup", "appointment_reminder", "general_service_information", "other_approved"] as const;
export type CampaignPurpose = (typeof campaignPurposes)[number];
export const purposeLabels: Record<CampaignPurpose, string> = { feedback_request: "Feedback Request", health_screening_followup: "Health Screening Follow-up", service_followup: "Service Follow-up", appointment_reminder: "Appointment Reminder", general_service_information: "General Service Information", other_approved: "Other Approved Communication" };
export const purposeConsentScope: Record<CampaignPurpose, "feedback_request" | "health_screening_followup" | "service_followup"> = { feedback_request: "feedback_request", health_screening_followup: "health_screening_followup", service_followup: "service_followup", appointment_reminder: "service_followup", general_service_information: "service_followup", other_approved: "service_followup" };
export const approvedMergeFields = ["FIRST NAME", "SURVEY LINK", "DATE", "TIME", "SERVICE", "HOSPITAL PHONE"] as const;
export const smsTemplates = [
  { id: "patient_feedback", name: "Patient Feedback", purpose: "feedback_request" as const, message: "Thank you for visiting Satellite General Hospital. We value your experience. Please take a minute or two to share your feedback with us: [SURVEY LINK]" },
  { id: "screening_followup", name: "Health Screening Follow-up", purpose: "health_screening_followup" as const, message: "Thank you for participating in our health screening. Satellite General Hospital appreciates your time and wishes you continued good health." },
  { id: "appointment_reminder", name: "Appointment Reminder", purpose: "appointment_reminder" as const, message: "Reminder from Satellite General Hospital: You have an appointment scheduled for [DATE] at [TIME]. Please contact us if you need assistance." },
  { id: "general_notice", name: "General Notice", purpose: "general_service_information" as const, message: "Satellite General Hospital: We would like to share an important service update. Please contact [HOSPITAL PHONE] if you need assistance." },
];
export const maxSmsCharacters = 480;

export function unknownMergeFields(message: string) { const found = [...message.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1].toUpperCase()); return [...new Set(found.filter((field) => !(approvedMergeFields as readonly string[]).includes(field)))]; }
export function smsEncoding(message: string) { return /^[\x00-\x7F€£¥èéùìòÇØøÅåÆæßÉÄÖÑÜäöñüà\r\n]*$/.test(message) ? "GSM-7" : "Unicode"; }
export function smsSegmentCount(message: string) { const unicode = smsEncoding(message) === "Unicode"; const single = unicode ? 70 : 160; const multipart = unicode ? 67 : 153; return message.length <= single ? 1 : Math.ceil(message.length / multipart); }
export function resolveMessagePreview(message: string) { return message.replaceAll("[FIRST NAME]", "Patient").replaceAll("[SURVEY LINK]", "https://satellitegeneralhospital.com/feedback/secure-link").replaceAll("[DATE]", "25 August 2026").replaceAll("[TIME]", "10:00 AM").replaceAll("[SERVICE]", "your selected service").replaceAll("[HOSPITAL PHONE]", "0303984314"); }
export function resolveSmsMessage(message: string, surveyLink?: string) { return message.replaceAll("[FIRST NAME]", "Patient").replaceAll("[SURVEY LINK]", surveyLink ?? "").replaceAll("[DATE]", "the scheduled date").replaceAll("[TIME]", "the scheduled time").replaceAll("[SERVICE]", "your selected service").replaceAll("[HOSPITAL PHONE]", "0303984314"); }
