import { createHash } from "node:crypto";
import { z } from "zod";
import { deduplicateRecipients, normalizeGhanaPhone } from "@/lib/sms";
import { AGE_GROUPS, SMS_CONSENT_SCOPES } from "@/lib/contacts";

export const campaignSources = ["all_contacts", "staff", "health_screening", "facility", "outpatient", "reception", "laboratory", "pharmacy", "custom_list", "other"] as const;
export const defaultFeedbackMessage = "Satellite General Hospital: Thank you for allowing us to serve you. Please take 1-2 minutes to share your experience with us. Your feedback may be submitted anonymously. [SURVEY LINK]";

const controlledMessage = z.string().trim().min(30).max(480).refine((value) => value.includes("[SURVEY LINK]"), "Message must contain [SURVEY LINK].").refine((value) => !/\b(diagnosis|medication|treatment|screening result|insurance details?)\b/i.test(value), "Message must not contain medical or insurance information.");

export const campaignAudienceSchema = z.strictObject({ gender: z.enum(["all", "female", "male", "other", "prefer_not_to_say"]).default("all"), ageGroups: z.array(z.enum(AGE_GROUPS)).max(7).default([]), source: z.enum(campaignSources).default("all_contacts"), facility: z.string().trim().max(160).default(""), group: z.string().trim().max(160).default(""), tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]), purpose: z.enum(SMS_CONSENT_SCOPES).default("feedback_request"), smsConsent: z.boolean().default(true), hasPhone: z.boolean().default(true), excludeContactedSince: z.string().trim().max(10).default("") });
export const campaignCreateSchema = z.strictObject({
  name: z.string().trim().min(3).max(120),
  source: z.enum(campaignSources),
  message: controlledMessage,
  audience: campaignAudienceSchema.optional(),
});

export const recipientImportSchema = z.strictObject({ recipients: z.string().trim().min(1).max(12_000) });
export const campaignSendSchema = z.strictObject({ action: z.enum(["test", "preview", "batch"]), confirmation: z.string().trim().max(80), testPhone: z.string().trim().max(30).optional() });
export const feedbackContactSchema = z.strictObject({
  name: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().min(10).max(30),
  source: z.enum(["staff", "health_screening", "facility", "outpatient", "reception", "laboratory", "pharmacy", "other"]),
});

export function parseRecipientImport(value: string) {
  const entries = value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
  const recipients = deduplicateRecipients(entries);
  return { recipients, invalidCount: entries.filter((item) => !normalizeGhanaPhone(item)).length, duplicateCount: entries.length - entries.filter((item) => !normalizeGhanaPhone(item)).length - recipients.length };
}

export function recipientKey(phone: string) {
  return createHash("sha256").update(phone).digest("hex");
}

export function campaignLink(code: string, source: string, testToken?: string) {
  const url = new URL("https://www.satellitegeneralhospital.com/feedback");
  url.searchParams.set("campaign", code);
  url.searchParams.set("source", source === "health_screening" ? "health_screening" : "sms");
  if (testToken) url.searchParams.set("t", testToken);
  return url.toString();
}
