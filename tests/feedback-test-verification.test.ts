import { describe, expect, it } from "vitest";
import {
  canVerifyFeedbackTestFromCampaignStatus,
  canReserveFeedbackTestSms,
  feedbackTestOpenedFields,
  feedbackTestVerifiedFields,
  feedbackTrackingFromSearchParams,
  hashFeedbackTestToken,
  validateFeedbackTestToken,
} from "@/lib/feedback-test-verification";
import {
  campaignStatusNoStoreHeaders,
  campaignTestActionsEnabled,
  campaignVerificationStatus,
  mergeCampaignVerificationStatus,
} from "@/lib/feedback-verification-state";

const now = new Date("2026-08-15T04:00:00.000Z");
const validRecord = { campaignId: "campaign-1", expiresAt: new Date("2026-08-16T04:00:00.000Z"), used: false };

describe("feedback campaign test verification", () => {
  it("persists validated campaign and token query parameters in initial form state", () => {
    expect(feedbackTrackingFromSearchParams({ campaign: "campaign-1", t: "A".repeat(43), source: "sms" })).toEqual({ campaign: "campaign-1", testToken: "A".repeat(43), source: "sms" });
  });

  it("uses the same normalized SHA-256 token hash path", () => {
    expect(hashFeedbackTestToken(`  ${"A".repeat(43)}  `)).toBe(hashFeedbackTestToken("A".repeat(43)));
    expect(hashFeedbackTestToken("A".repeat(43))).toHaveLength(64);
  });

  it("records link open without verifying the campaign", () => {
    const fields = feedbackTestOpenedFields(now);
    expect(fields).toMatchObject({ status: "test_link_opened", testLinkOpenedAt: now });
    expect(fields).not.toHaveProperty("testVerified");
  });

  it("accepts the correct active campaign token and creates the complete verification update", () => {
    expect(validateFeedbackTestToken(validRecord, "campaign-1", now)).toEqual({ ok: true, campaignId: "campaign-1" });
    expect(feedbackTestVerifiedFields("SGH-FBK-TEST", "feedback-1", now, now)).toMatchObject({ status: "test_verified", testVerified: true, testLinkOpenedAt: now, testFeedbackSubmittedAt: now, testVerifiedAt: now, testFeedbackReference: "SGH-FBK-TEST", testFeedbackId: "feedback-1" });
  });

  it("rejects wrong, expired, consumed, missing, and unrelated campaign tokens", () => {
    expect(validateFeedbackTestToken(null, "campaign-1", now)).toMatchObject({ ok: false, reason: "token_not_found" });
    expect(validateFeedbackTestToken({ ...validRecord, campaignId: "other" }, "campaign-1", now)).toMatchObject({ ok: false, reason: "campaign_mismatch" });
    expect(validateFeedbackTestToken({ ...validRecord, expiresAt: now }, "campaign-1", now)).toMatchObject({ ok: false, reason: "token_expired" });
    expect(validateFeedbackTestToken({ ...validRecord, used: true }, "campaign-1", now)).toMatchObject({ ok: false, reason: "token_consumed" });
  });

  it("prevents duplicate verification and audit by rejecting a consumed token", () => {
    expect(validateFeedbackTestToken({ ...validRecord, used: true }, "campaign-1", now).ok).toBe(false);
  });

  it("keeps an ambiguously delivered reserved link verifiable without permitting a resend", () => {
    expect(canVerifyFeedbackTestFromCampaignStatus("test_sending")).toBe(true);
    expect(canVerifyFeedbackTestFromCampaignStatus("test_delivery_unknown")).toBe(true);
    expect(canVerifyFeedbackTestFromCampaignStatus("ready")).toBe(false);
  });

  it("permits only one provider attempt until the reserved outcome is resolved", () => {
    expect(canReserveFeedbackTestSms({ status: "ready" })).toBe(true);
    expect(canReserveFeedbackTestSms({ status: "test_sending", testSendState: "sending" })).toBe(false);
    expect(canReserveFeedbackTestSms({ status: "test_delivery_unknown", testSendState: "delivery_unknown" })).toBe(false);
    expect(canReserveFeedbackTestSms({ status: "test_sent", testSendState: "accepted", testSmsAcceptedAt: now })).toBe(false);
  });

  it("projects an immediately verified admin status with no-store headers", () => {
    const status = campaignVerificationStatus({ status: "test_verified", testSmsAcceptedAt: now, testLinkOpenedAt: now, testFeedbackSubmittedAt: now, testVerified: true });
    expect(status).toEqual({ status: "test_verified", testSmsAccepted: true, testLinkOpened: true, testFeedbackSubmitted: true, testVerified: true, testSendState: "" });
    expect(campaignStatusNoStoreHeaders["Cache-Control"]).toContain("no-store");
  });

  it("keeps actions locked before verification and unlocks both from a polling merge", () => {
    const locked = { testVerified: false, canSendNow: false, canSchedule: false };
    expect(campaignTestActionsEnabled(locked)).toBe(false);
    const polled = mergeCampaignVerificationStatus(locked, { testVerified: true, status: "test_verified" });
    expect(campaignTestActionsEnabled(polled)).toBe(true);
  });

  it("merges provider acceptance into both active and listed campaign state", () => {
    const campaign = { code: "campaign-1", status: "ready", testSmsAccepted: false, testSendState: "" };
    const live = mergeCampaignVerificationStatus(campaign, { status: "test_sent", testSmsAccepted: true, testSendState: "accepted" });
    expect(live).toMatchObject({ code: "campaign-1", status: "test_sent", testSmsAccepted: true, testSendState: "accepted" });
  });
});
