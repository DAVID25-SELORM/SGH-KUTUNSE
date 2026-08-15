import "server-only";

import { adminDb } from "./firebase-admin";
import { DEFAULT_SMS_POLICY, smsPolicySchema, type SmsPolicy } from "@/lib/sms-policy";

export const SMS_SETTINGS_COLLECTION = "website_settings";
export const SMS_SETTINGS_DOCUMENT = "sms";

export async function getSmsPolicy(): Promise<SmsPolicy> {
  const snapshot = await adminDb.collection(SMS_SETTINGS_COLLECTION).doc(SMS_SETTINGS_DOCUMENT).get();
  if (!snapshot.exists) return DEFAULT_SMS_POLICY;
  const data = snapshot.data() ?? {};
  const parsed = smsPolicySchema.safeParse({ sendingRestrictionEnabled: data.sendingRestrictionEnabled, sendingStartTime: data.sendingStartTime, sendingEndTime: data.sendingEndTime, timezone: data.timezone });
  return parsed.success ? parsed.data : DEFAULT_SMS_POLICY;
}
