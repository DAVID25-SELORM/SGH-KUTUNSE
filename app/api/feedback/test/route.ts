import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { feedbackTestOpenedFields, hashFeedbackTestToken, validateFeedbackTestToken } from "@/lib/feedback-test-verification";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { token?: string } | null;
  const token = body?.token?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{32,160}$/.test(token)) return NextResponse.json({ ok: false }, { status: 400 });
  const tokenHash = hashFeedbackTestToken(token);
  const tokenRef = adminDb.collection("feedback_test_tokens").doc(tokenHash);
  const openedCampaignId = await adminDb.runTransaction(async (transaction) => {
    const tokenSnapshot = await transaction.get(tokenRef);
    const decision = validateFeedbackTestToken(tokenSnapshot.exists ? tokenSnapshot.data()! : null, "");
    if (!decision.ok) {
      console.warn("feedback_test_verification", { event: "link_open_rejected", campaignId: tokenSnapshot.data()?.campaignId ?? null, reason: decision.reason });
      return "";
    }
    const campaignRef = adminDb.collection("feedback_campaigns").doc(decision.campaignId);
    const campaignSnapshot = await transaction.get(campaignRef);
    if (!campaignSnapshot.exists) {
      console.warn("feedback_test_verification", { event: "link_open_rejected", campaignId: decision.campaignId, reason: "campaign_not_found" });
      return "";
    }
    transaction.set(tokenRef, { openedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.update(campaignRef, feedbackTestOpenedFields(FieldValue.serverTimestamp()));
    return decision.campaignId;
  });
  if (openedCampaignId) console.info("feedback_test_verification", { event: "link_open_recorded", campaignId: openedCampaignId });
  return NextResponse.json({ ok: Boolean(openedCampaignId) }, { headers: { "Cache-Control": "no-store" } });
}
