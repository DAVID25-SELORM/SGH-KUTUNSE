import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { createReference } from "@/lib/reference";
import type { FeedbackInput } from "@/lib/validation";
import { feedbackTestVerifiedFields, hashFeedbackTestToken, validateFeedbackTestToken } from "@/lib/feedback-test-verification";
export function feedbackFlags(data: FeedbackInput) {
  const low =
    data.overallSatisfaction === "very_dissatisfied" ||
    data.ratings.overallQuality <= 2;
  return {
    needsReview: low || data.contactRequested || data.receiptConcern === "yes",
    receiptRestricted: data.receiptConcern === "yes",
    followUpRequested: data.contactRequested,
  };
}
export async function createFeedback(data: FeedbackInput) {
  const testTokenHash = data.testToken ? hashFeedbackTestToken(data.testToken) : "";
  let verifiedLogCampaignId = data.campaign || "";
  for (let i = 0; i < 4; i++) {
    const reference = createReference("FBK");
    const ref = adminDb.collection("feedback_responses").doc();
    const now = FieldValue.serverTimestamp();
    try {
      await adminDb.runTransaction(async (t) => {
        const reservation = adminDb
          .collection("submission_references")
          .doc(reference);
        const testTokenRef = testTokenHash ? adminDb.collection("feedback_test_tokens").doc(testTokenHash) : null;
        const [reservationSnapshot, testTokenSnapshot] = await Promise.all([
          t.get(reservation),
          testTokenRef ? t.get(testTokenRef) : Promise.resolve(null),
        ]);
        if (reservationSnapshot.exists)
          throw new Error("REFERENCE_COLLISION");
        const safe = { ...data };
        delete safe.website;
        delete safe.testToken;
        let verifiedCampaignId = data.campaign || "";
        if (testTokenRef) {
          const decision = validateFeedbackTestToken(testTokenSnapshot?.exists ? testTokenSnapshot.data()! : null, verifiedCampaignId);
          if (!decision.ok) {
            console.warn("feedback_test_verification", { event: "submission_rejected", campaignId: verifiedCampaignId || null, reason: decision.reason });
            throw new Error("INVALID_TEST_TOKEN");
          }
          verifiedCampaignId = decision.campaignId;
          verifiedLogCampaignId = decision.campaignId;
        }
        const campaignRef = verifiedCampaignId ? adminDb.collection("feedback_campaigns").doc(verifiedCampaignId) : null;
        const campaignSnapshot = campaignRef ? await t.get(campaignRef) : null;
        if (testTokenRef && !campaignSnapshot?.exists) {
          console.warn("feedback_test_verification", { event: "submission_rejected", campaignId: verifiedCampaignId, reason: "campaign_not_found" });
          throw new Error("INVALID_TEST_TOKEN");
        }
        if (testTokenRef && !["test_sent", "test_link_opened"].includes(String(campaignSnapshot?.data()?.status ?? ""))) {
          console.warn("feedback_test_verification", { event: "submission_rejected", campaignId: verifiedCampaignId, reason: "invalid_campaign_state" });
          throw new Error("INVALID_TEST_TOKEN");
        }
        t.create(reservation, {
          kind: "feedback",
          documentId: ref.id,
          createdAt: now,
        });
        t.create(ref, {
          ...safe,
          ...(verifiedCampaignId ? { campaign: verifiedCampaignId } : {}),
          ...feedbackFlags(data),
          reference,
          status: "new",
          priority: feedbackFlags(data).needsReview ? "high" : "normal",
          assignedTo: null,
          createdAt: now,
          updatedAt: now,
          lastActionAt: now,
        });
        t.create(ref.collection("history").doc(), {
          action: "submitted",
          actorUid: null,
          actorDisplayName: "Anonymous respondent",
          createdAt: now,
          safeMetadata: { source: data.source },
        });
        if (campaignRef && campaignSnapshot?.exists) {
          const update: Record<string, unknown> = { responseCount: FieldValue.increment(1), updatedAt: now };
          if (testTokenRef) Object.assign(update, feedbackTestVerifiedFields(reference, ref.id, campaignSnapshot.data()?.testLinkOpenedAt, now));
          t.update(campaignRef, update);
        }
        if (testTokenRef) {
          t.update(testTokenRef, { used: true, submittedAt: now, feedbackId: ref.id });
          t.create(adminDb.collection("audit_logs").doc(), { actorUid: "system:feedback-test", action: "feedback_campaign.test_verified", entityType: "feedback_campaign", entityId: verifiedCampaignId, metadata: { feedbackReference: reference }, timestamp: now });
        }
      });
      if (testTokenHash) console.info("feedback_test_verification", { event: "submission_verified", campaignId: verifiedLogCampaignId, reference });
      return reference;
    } catch (e) {
      if (e instanceof Error && e.message === "REFERENCE_COLLISION") continue;
      throw e;
    }
  }
  throw new Error("Reference allocation failed");
}
