import { createHash } from "node:crypto";

export type FeedbackTestTokenRecord = {
  campaignId?: unknown;
  expiresAt?: { toDate?: () => Date } | Date | null;
  used?: unknown;
};

export type FeedbackTestTokenDecision =
  | { ok: true; campaignId: string }
  | { ok: false; reason: "token_not_found" | "token_consumed" | "token_expired" | "campaign_mismatch" | "campaign_missing" };

export function hashFeedbackTestToken(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}

export function feedbackTrackingFromSearchParams(params: Record<string, string | string[] | undefined>) {
  const value = (key: string) => typeof params[key] === "string" ? params[key] : "";
  const campaign = value("campaign").trim();
  const testToken = value("t").trim();
  const source = value("source").trim();
  return {
    campaign: /^[A-Za-z0-9_-]{1,80}$/.test(campaign) ? campaign : "",
    testToken: /^[A-Za-z0-9_-]{32,160}$/.test(testToken) ? testToken : "",
    source: ["website", "health_screening", "facility", "qr", "sms"].includes(source) ? source : "website",
  };
}

export function validateFeedbackTestToken(
  record: FeedbackTestTokenRecord | null,
  expectedCampaignId: string,
  now = new Date(),
): FeedbackTestTokenDecision {
  if (!record) return { ok: false, reason: "token_not_found" };
  if (record.used === true) return { ok: false, reason: "token_consumed" };
  const expiresAt = record.expiresAt instanceof Date ? record.expiresAt : record.expiresAt?.toDate?.();
  if (!(expiresAt instanceof Date) || expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "token_expired" };
  const campaignId = typeof record.campaignId === "string" ? record.campaignId : "";
  if (!campaignId) return { ok: false, reason: "campaign_missing" };
  if (expectedCampaignId && campaignId !== expectedCampaignId) return { ok: false, reason: "campaign_mismatch" };
  return { ok: true, campaignId };
}

export function feedbackTestOpenedFields(timestamp: unknown) {
  return { status: "test_link_opened", testLinkOpenedAt: timestamp, updatedAt: timestamp };
}

export function feedbackTestVerifiedFields(reference: string, feedbackId: string, openedAt: unknown, timestamp: unknown) {
  return {
    status: "test_verified",
    testVerified: true,
    testLinkOpenedAt: openedAt ?? timestamp,
    testFeedbackSubmittedAt: timestamp,
    testVerifiedAt: timestamp,
    testFeedbackReference: reference,
    testFeedbackId: feedbackId,
    updatedAt: timestamp,
  };
}

export function canVerifyFeedbackTestFromCampaignStatus(status: unknown) {
  return ["test_sending", "test_delivery_unknown", "test_sent", "test_link_opened"].includes(String(status ?? ""));
}

export function canReserveFeedbackTestSms(data: Record<string, unknown>) {
  return !data.testSmsAcceptedAt && !["sending", "delivery_unknown"].includes(String(data.testSendState ?? ""));
}
