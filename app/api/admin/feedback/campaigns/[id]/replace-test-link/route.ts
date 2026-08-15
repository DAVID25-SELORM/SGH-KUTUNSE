import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { campaignLink } from "@/lib/feedback-campaigns";
import { hashFeedbackTestToken, isCurrentFeedbackTestAttempt } from "@/lib/feedback-test-verification";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_sms");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await context.params;
  const campaignRef = adminDb.collection("feedback_campaigns").doc(id);
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashFeedbackTestToken(token);
  const newTokenRef = adminDb.collection("feedback_test_tokens").doc(tokenHash);
  const replaced = await adminDb.runTransaction(async (transaction) => {
    const campaignSnapshot = await transaction.get(campaignRef);
    if (!campaignSnapshot.exists) return false;
    const campaign = campaignSnapshot.data()!;
    const oldHash = typeof campaign.testTokenHash === "string" ? campaign.testTokenHash : "";
    if (!oldHash || campaign.testVerified === true || !["test_sending", "test_delivery_unknown", "test_sent", "test_link_opened"].includes(String(campaign.status))) return false;
    const oldTokenRef = adminDb.collection("feedback_test_tokens").doc(oldHash);
    const oldTokenSnapshot = await transaction.get(oldTokenRef);
    if (!oldTokenSnapshot.exists || !isCurrentFeedbackTestAttempt(campaign, oldTokenSnapshot.data()!, oldHash) || oldTokenSnapshot.get("used") === true || oldTokenSnapshot.get("submittedAt")) return false;
    const now = FieldValue.serverTimestamp();
    transaction.update(oldTokenRef, { used: true, invalidatedAt: now, invalidationReason: "admin_replaced_unusable_link" });
    transaction.create(newTokenRef, { campaignId: id, attemptId: campaign.testSendAttemptId, recipientHash: oldTokenSnapshot.get("recipientHash"), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), createdAt: now, openedAt: null, submittedAt: null, used: false, replacement: true });
    transaction.update(campaignRef, { testTokenHash: tokenHash, testLinkOpenedAt: null, testFeedbackSubmittedAt: null, testVerifiedAt: null, testVerified: false, status: campaign.testSendState === "delivery_unknown" ? "test_delivery_unknown" : "test_sent", updatedAt: now });
    return { source: String(campaign.source ?? "all_contacts") };
  });
  if (!replaced) return NextResponse.json({ ok: false, message: "The current test link cannot be replaced because it was already used, submitted, verified, or superseded." }, { status: 409 });
  await writeAudit(actor.uid, "feedback_campaign.test_link_replaced", "feedback_campaign", id);
  console.info("feedback_test_verification", { event: "test_link_replaced", campaignId: id });
  return NextResponse.json({ ok: true, link: campaignLink(id, replaced.source, token) }, { headers: { "Cache-Control": "private, no-store" } });
}
