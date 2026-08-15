import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { feedbackTestOpenedFields, hashFeedbackTestToken, isCurrentFeedbackTestAttempt, validateFeedbackTestToken } from "@/lib/feedback-test-verification";
import { adminDb } from "./firebase-admin";

export async function recordFeedbackTestOpen(token: string) {
  const normalized = token.trim();
  if (!/^[A-Za-z0-9_-]{32,160}$/.test(normalized)) return { ok: false as const, reason: "invalid_format" };
  const tokenHash = hashFeedbackTestToken(normalized);
  const tokenRef = adminDb.collection("feedback_test_tokens").doc(tokenHash);
  return adminDb.runTransaction(async (transaction) => {
    const tokenSnapshot = await transaction.get(tokenRef);
    const decision = validateFeedbackTestToken(tokenSnapshot.exists ? tokenSnapshot.data()! : null, "");
    if (!decision.ok) return decision;
    const campaignRef = adminDb.collection("feedback_campaigns").doc(decision.campaignId);
    const campaignSnapshot = await transaction.get(campaignRef);
    if (!campaignSnapshot.exists) return { ok: false as const, reason: "campaign_missing" };
    const campaign = campaignSnapshot.data()!;
    if (!isCurrentFeedbackTestAttempt(campaign, tokenSnapshot.data()!, tokenHash)) {
      return { ok: false as const, reason: "not_current_attempt" };
    }
    const now = FieldValue.serverTimestamp();
    transaction.set(tokenRef, { openedAt: tokenSnapshot.get("openedAt") ?? now }, { merge: true });
    if (!campaign.testLinkOpenedAt) transaction.update(campaignRef, feedbackTestOpenedFields(now));
    return { ok: true as const, campaignId: decision.campaignId };
  });
}
