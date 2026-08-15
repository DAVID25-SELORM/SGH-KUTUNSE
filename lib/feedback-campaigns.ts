import { createHash } from "node:crypto";
import { z } from "@/lib/zod";
import { AGE_GROUPS, SMS_CONSENT_SCOPES } from "@/lib/contacts";
import { campaignPurposes, maxSmsCharacters, unknownMergeFields } from "@/lib/sms-message";
import { campaignSources } from "@/lib/feedback-campaign-client";

export { campaignSources, defaultFeedbackMessage, parseRecipientImport } from "@/lib/feedback-campaign-client";

const controlledMessage = z.string().trim().min(20).max(maxSmsCharacters).refine((value) => unknownMergeFields(value).length === 0, "Message contains an unsupported merge field.").refine((value) => !/\b(diagnosis|medication|treatment|screening result|insurance details?|password|api key|firestore|member id|claim number)\b/i.test(value), "Message must not contain confidential clinical, insurance, credential, or internal identifier information.");
export const campaignMessageSchema = z.strictObject({ message: controlledMessage, purpose: z.enum(campaignPurposes).default("feedback_request"), templateId: z.string().trim().max(80).default("patient_feedback"), messageMode: z.enum(["template", "custom"]).default("template") }).superRefine((value, context) => { if (value.purpose === "feedback_request" && !value.message.includes("[SURVEY LINK]")) context.addIssue({ code: "custom", path: ["message"], message: "Feedback Request messages must contain [SURVEY LINK]." }); });

export function canEditCampaignMessage(campaign: Record<string, unknown>) {
  return ["draft", "ready", "test_sent", "test_link_opened", "test_verified"].includes(String(campaign.status));
}

export const campaignAudienceSchema = z.strictObject({ gender: z.enum(["all", "female", "male", "other", "prefer_not_to_say"]).default("all"), ageGroups: z.array(z.enum(AGE_GROUPS)).max(7).default([]), source: z.enum(campaignSources).default("all_contacts"), facility: z.string().trim().max(160).default(""), group: z.string().trim().max(160).default(""), tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]), purpose: z.enum(SMS_CONSENT_SCOPES).default("feedback_request"), smsConsent: z.boolean().default(true), hasPhone: z.boolean().default(true), excludeContactedSince: z.string().trim().max(10).default("") });
export const campaignCreateSchema = z.strictObject({
  name: z.string().trim().min(3).max(120),
  source: z.enum(campaignSources),
  message: controlledMessage,
  purpose: z.enum(campaignPurposes).default("feedback_request"),
  templateId: z.string().trim().max(80).default("patient_feedback"),
  messageMode: z.enum(["template", "custom"]).default("template"),
  audience: campaignAudienceSchema.optional(),
}).superRefine((value, context) => { if (value.purpose === "feedback_request" && !value.message.includes("[SURVEY LINK]")) context.addIssue({ code: "custom", path: ["message"], message: "Feedback Request messages must contain [SURVEY LINK]." }); });

export const recipientImportSchema = z.strictObject({ recipients: z.string().trim().min(1).max(12_000) });
export const campaignSendSchema = z.strictObject({ action: z.enum(["test", "preview", "batch", "scheduled"]), confirmation: z.string().trim().max(80), testPhone: z.string().trim().max(30).optional(), scheduleGeneration: z.number().int().positive().optional() });
export const campaignScheduleSchema = z.strictObject({
  action: z.enum(["schedule", "reschedule", "cancel"]),
  date: z.string().trim().max(10).default(""),
  time: z.string().trim().max(5).default(""),
  timezone: z.literal("Africa/Accra").default("Africa/Accra"),
});
export const feedbackContactSchema = z.strictObject({
  name: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().min(10).max(30),
  source: z.enum(["staff", "health_screening", "facility", "outpatient", "reception", "laboratory", "pharmacy", "other"]),
});

export function recipientKey(phone: string) {
  return createHash("sha256").update(phone).digest("hex");
}

export function campaignLink(code: string, source: string, testToken?: string) {
  const url = new URL("https://www.satellitegeneralhospital.com/feedback");
  if (testToken) url.searchParams.set("t", testToken);
  url.searchParams.set("campaign", code);
  url.searchParams.set("source", source === "health_screening" ? "health_screening" : "sms");
  return url.toString();
}
