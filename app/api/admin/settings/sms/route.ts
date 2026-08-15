import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { smsPolicySchema } from "@/lib/sms-policy";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";
import { getSmsPolicy, SMS_SETTINGS_COLLECTION, SMS_SETTINGS_DOCUMENT } from "@/lib/server/sms-settings";

export async function GET() {
  const actor = await verifyAdminRequest("sms_settings_view");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  return NextResponse.json({ ok: true, policy: await getSmsPolicy() });
}

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("sms_settings_write");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, smsPolicySchema);
  if (parsed.error) return parsed.error;
  const oldPolicy = await getSmsPolicy();
  const policy = parsed.data;
  await adminDb.collection(SMS_SETTINGS_COLLECTION).doc(SMS_SETTINGS_DOCUMENT).set({ ...policy, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid }, { merge: true });
  const metadata = { oldEnabled: String(oldPolicy.sendingRestrictionEnabled), newEnabled: String(policy.sendingRestrictionEnabled), startTime: policy.sendingStartTime, endTime: policy.sendingEndTime, timezone: policy.timezone };
  await writeAudit(actor.uid, "sms_settings.updated", "sms_settings", SMS_SETTINGS_DOCUMENT, metadata);
  if (oldPolicy.sendingRestrictionEnabled !== policy.sendingRestrictionEnabled) await writeAudit(actor.uid, policy.sendingRestrictionEnabled ? "sms_settings.restriction_enabled" : "sms_settings.restriction_disabled", "sms_settings", SMS_SETTINGS_DOCUMENT, metadata);
  return NextResponse.json({ ok: true, policy });
}
