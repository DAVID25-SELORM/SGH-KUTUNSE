import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { validateCompletedFeedbackTest } from "@/lib/feedback-test-verification";
import { campaignStatusNoStoreHeaders, campaignVerificationStatus } from "@/lib/feedback-verification-state";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";

const messages = {
  test_not_sent: "A Test SMS attempt has not been detected for this campaign.",
  token_not_found: "The secure Test SMS link could not be found. Send one Test SMS before continuing.",
  campaign_mismatch: "The latest secure test link does not belong to this campaign.",
  link_not_opened: "The latest secure survey link has not been opened yet.",
  feedback_not_submitted: "We haven’t detected a completed feedback submission for this test yet. Open the latest test link, complete the form, then try again.",
  token_expired: "The secure test link expired before feedback was submitted. A new Test SMS is required.",
  feedback_not_found: "The linked feedback submission could not be found. Please complete the latest test form, then try again.",
  feedback_mismatch: "The feedback submission is not securely linked to this campaign’s latest test.",
  message_changed: "The campaign message changed after testing. Save it and complete a new Test SMS.",
} as const;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_sms");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await context.params;
  const campaignRef = adminDb.collection("feedback_campaigns").doc(id);
  const initial = await campaignRef.get();
  if (!initial.exists) return NextResponse.json({ ok: false }, { status: 404 });
  let tokenHash = typeof initial.get("testTokenHash") === "string" ? String(initial.get("testTokenHash")) : "";
  if (!tokenHash) {
    const candidates = await adminDb.collection("feedback_test_tokens").where("campaignId", "==", id).limit(10).get();
    const attemptId = String(initial.get("testSendAttemptId") ?? "");
    const matching = candidates.docs.find((document) => !attemptId || document.get("attemptId") === attemptId);
    tokenHash = matching?.id ?? "";
  }
  const result = await adminDb.runTransaction(async (transaction) => {
    const campaignSnapshot = await transaction.get(campaignRef);
    const campaign = campaignSnapshot.data() ?? {};
    const tokenRef = tokenHash ? adminDb.collection("feedback_test_tokens").doc(tokenHash) : null;
    const tokenSnapshot = tokenRef ? await transaction.get(tokenRef) : null;
    const token = tokenSnapshot?.exists ? tokenSnapshot.data()! : null;
    const feedbackId = typeof token?.feedbackId === "string" ? token.feedbackId : "";
    const feedbackRef = feedbackId ? adminDb.collection("feedback_responses").doc(feedbackId) : null;
    const feedbackSnapshot = feedbackRef ? await transaction.get(feedbackRef) : null;
    const feedback = feedbackSnapshot?.exists ? { ...feedbackSnapshot.data()!, id: feedbackSnapshot.id } : null;
    const decision = validateCompletedFeedbackTest(id, campaign, token, feedback, tokenHash);
    if (!decision.ok) return { decision, transitioned: false, status: campaignVerificationStatus(campaign) };
    const transitioned = campaign.testVerified !== true;
    if (transitioned) transaction.update(campaignRef, {
      status: "test_verified", testVerified: true, testLinkOpenedAt: campaign.testLinkOpenedAt ?? token?.openedAt ?? FieldValue.serverTimestamp(),
      testFeedbackSubmittedAt: campaign.testFeedbackSubmittedAt ?? token?.submittedAt ?? FieldValue.serverTimestamp(), testVerifiedAt: FieldValue.serverTimestamp(),
      testFeedbackReference: decision.reference, testFeedbackId: decision.feedbackId, testTokenHash: tokenHash, updatedAt: FieldValue.serverTimestamp(),
    });
    return { decision, transitioned, status: { ...campaignVerificationStatus(campaign), status: "test_verified", testSmsAccepted: true, testLinkOpened: true, testFeedbackSubmitted: true, testVerified: true } };
  });
  if (!result.decision.ok) {
    console.info("feedback_test_verification", { event: "admin_confirmation_pending", campaignId: id, reason: result.decision.reason });
    return NextResponse.json({ ok: false, reason: result.decision.reason, message: messages[result.decision.reason], status: result.status }, { status: 409, headers: campaignStatusNoStoreHeaders });
  }
  if (result.transitioned) await writeAudit(actor.uid, "feedback_campaign.test_verified_by_recheck", "feedback_campaign", id, { feedbackReference: result.decision.reference });
  console.info("feedback_test_verification", { event: result.transitioned ? "admin_confirmation_verified" : "admin_confirmation_idempotent", campaignId: id });
  return NextResponse.json({ ok: true, status: result.status }, { headers: campaignStatusNoStoreHeaders });
}
