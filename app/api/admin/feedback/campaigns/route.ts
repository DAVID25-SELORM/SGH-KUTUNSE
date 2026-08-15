import { createHash, randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { campaignCreateSchema } from "@/lib/feedback-campaigns";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_campaigns");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, campaignCreateSchema);
  if (parsed.error) return parsed.error;
  const code = randomBytes(12).toString("base64url");
  const messageHash = createHash("sha256").update(parsed.data.message).digest("hex");
  await adminDb.collection("feedback_campaigns").doc(code).create({ ...parsed.data, code, status: "draft", messageVersion: 1, messageHash, testedMessageHash: null, providerMode: "mock", recipientCount: 0, queuedCount: 0, mockedCount: 0, acceptedCount: 0, deliveredCount: 0, failedCount: 0, responseCount: 0, createdBy: actor.uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  await writeAudit(actor.uid, "sms_campaign.message_created", "feedback_campaign", code, { source: parsed.data.source, purpose: parsed.data.purpose, messageHash });
  return NextResponse.json({ ok: true, code }, { status: 201 });
}
