import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { createReference } from "@/lib/reference";
import type { FeedbackInput } from "@/lib/validation";
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
  for (let i = 0; i < 4; i++) {
    const reference = createReference("FBK");
    const ref = adminDb.collection("feedback_responses").doc();
    const now = FieldValue.serverTimestamp();
    try {
      await adminDb.runTransaction(async (t) => {
        const reservation = adminDb
          .collection("submission_references")
          .doc(reference);
        const campaignRef = data.campaign
          ? adminDb.collection("feedback_campaigns").doc(data.campaign)
          : null;
        const [reservationSnapshot, campaignSnapshot] = await Promise.all([
          t.get(reservation),
          campaignRef ? t.get(campaignRef) : Promise.resolve(null),
        ]);
        if (reservationSnapshot.exists)
          throw new Error("REFERENCE_COLLISION");
        const safe = { ...data };
        delete safe.website;
        t.create(reservation, {
          kind: "feedback",
          documentId: ref.id,
          createdAt: now,
        });
        t.create(ref, {
          ...safe,
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
        if (campaignRef && campaignSnapshot?.exists)
          t.update(campaignRef, { responseCount: FieldValue.increment(1), updatedAt: now });
      });
      return reference;
    } catch (e) {
      if (e instanceof Error && e.message === "REFERENCE_COLLISION") continue;
      throw e;
    }
  }
  throw new Error("Reference allocation failed");
}
