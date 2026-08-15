import { z } from "@/lib/zod";

export const SMS_POLICY_TIMEZONE = "Africa/Accra" as const;

export const smsPolicySchema = z.strictObject({
  sendingRestrictionEnabled: z.boolean(),
  sendingStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid start time in HH:mm format."),
  sendingEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid end time in HH:mm format."),
  timezone: z.literal(SMS_POLICY_TIMEZONE),
}).superRefine((value, context) => {
  if (value.sendingRestrictionEnabled && value.sendingStartTime === value.sendingEndTime) {
    context.addIssue({ code: "custom", path: ["sendingEndTime"], message: "Start and end time must be different." });
  }
});

export type SmsPolicy = z.infer<typeof smsPolicySchema>;

export const DEFAULT_SMS_POLICY: SmsPolicy = {
  sendingRestrictionEnabled: false,
  sendingStartTime: "08:00",
  sendingEndTime: "19:00",
  timezone: SMS_POLICY_TIMEZONE,
};

function minutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function isTimeWithinSmsPolicy(time: string, policy: SmsPolicy) {
  if (!policy.sendingRestrictionEnabled) return true;
  const current = minutes(time);
  const start = minutes(policy.sendingStartTime);
  const end = minutes(policy.sendingEndTime);
  return start < end ? current >= start && current < end : current >= start || current < end;
}

export function accraTime(value: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: SMS_POLICY_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(value);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function isDateWithinSmsPolicy(value: Date, policy: SmsPolicy) {
  return isTimeWithinSmsPolicy(accraTime(value), policy);
}

export function smsPolicyLabel(policy: SmsPolicy) {
  return policy.sendingRestrictionEnabled ? `${policy.sendingStartTime}–${policy.sendingEndTime} GMT` : "No time restriction";
}

export function smsPolicyRestrictionMessage(policy: SmsPolicy) {
  return `SMS sending is currently restricted to ${smsPolicyLabel(policy)}. You can change this under Admin → Settings → SMS.`;
}
