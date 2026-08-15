import { FieldValue } from "firebase-admin/firestore";
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
      transaction.update(campaignRef, { message: parsed.data.message, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.create(auditRef, { actorUid: actor.uid, action: "feedback_campaign.message_updated", entityType: "feedback_campaign", entityId: id, metadata: { status: String(snapshot.get("status") ?? "") }, timestamp: FieldValue.serverTimestamp() });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CAMPAIGN_NOT_FOUND") return NextResponse.json({ ok: false, message: "Campaign not found." }, { status: 404 });
    if (error instanceof Error && error.message === "CAMPAIGN_MESSAGE_LOCKED") return NextResponse.json({ ok: false, message: "The message is locked after the test SMS is sent. Create a new campaign to change and retest the message." }, { status: 409 });
    throw error;
  }
  return NextResponse.json({ ok: true, message: parsed.data.message });
}
