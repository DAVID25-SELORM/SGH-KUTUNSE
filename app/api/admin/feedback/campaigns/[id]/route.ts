import { FieldValue } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { campaignMessageSchema, canEditCampaignMessage } from "@/lib/feedback-campaigns";
import { verifyAdminRequest } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_campaigns");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, campaignMessageSchema);
  if (parsed.error) return parsed.error;
  const { id } = await context.params;
  if (!/^[\w-]{1,128}$/.test(id)) return NextResponse.json({ ok: false, message: "Invalid campaign." }, { status: 400 });

  const campaignRef = adminDb.collection("feedback_campaigns").doc(id);
  try {
    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(campaignRef);
      if (!snapshot.exists) throw new Error("CAMPAIGN_NOT_FOUND");
      if (!canEditCampaignMessage(snapshot.data() ?? {})) throw new Error("CAMPAIGN_MESSAGE_LOCKED");
      const previous = snapshot.data()!; const messageHash = createHash("sha256").update(parsed.data.message).digest("hex");
      if (parsed.data.purpose !== String(previous.purpose ?? "feedback_request") && previous.status !== "draft") throw new Error("CAMPAIGN_PURPOSE_LOCKED");
      const changed = messageHash !== previous.messageHash || parsed.data.purpose !== String(previous.purpose ?? "feedback_request");
      transaction.update(campaignRef, { message: parsed.data.message, purpose: parsed.data.purpose, templateId: parsed.data.templateId, messageMode: parsed.data.messageMode, messageHash, messageVersion: changed ? FieldValue.increment(1) : Number(previous.messageVersion ?? 1), ...(changed ? { status: "ready", testedMessageHash: null, testTokenHash: null, testSmsAcceptedAt: null, testLinkOpenedAt: null, testFeedbackSubmittedAt: null, testVerifiedAt: null, testVerified: false } : {}), updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.create(auditRef, { actorUid: actor.uid, action: changed && previous.testVerified === true ? "sms_campaign.test_invalidated" : parsed.data.templateId !== previous.templateId ? "sms_campaign.template_selected" : "sms_campaign.message_updated", entityType: "feedback_campaign", entityId: id, metadata: { status: String(snapshot.get("status") ?? ""), purpose: parsed.data.purpose, messageHash, templateId: parsed.data.templateId || "custom", messageMode: parsed.data.messageMode }, timestamp: FieldValue.serverTimestamp() });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CAMPAIGN_NOT_FOUND") return NextResponse.json({ ok: false, message: "Campaign not found." }, { status: 404 });
    if (error instanceof Error && error.message === "CAMPAIGN_MESSAGE_LOCKED") return NextResponse.json({ ok: false, message: "The message is locked after scheduling or sending. Create a new campaign to change it." }, { status: 409 });
    if (error instanceof Error && error.message === "CAMPAIGN_PURPOSE_LOCKED") return NextResponse.json({ ok: false, message: "Change recipients to start a new campaign when changing the message purpose and consent scope." }, { status: 409 });
    throw error;
  }
  return NextResponse.json({ ok: true, ...parsed.data, messageHash: createHash("sha256").update(parsed.data.message).digest("hex") });
}
