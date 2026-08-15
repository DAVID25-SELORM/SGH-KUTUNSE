export function campaignVerificationStatus(data: Record<string, unknown>) {
  return {
    status: String(data.status ?? "draft"),
    testSmsAccepted: Boolean(data.testSmsAcceptedAt),
    testLinkOpened: Boolean(data.testLinkOpenedAt),
    testFeedbackSubmitted: Boolean(data.testFeedbackSubmittedAt),
    testVerified: data.testVerified === true,
    testSendState: String(data.testSendState ?? ""),
  };
}

export function campaignTestActionsEnabled(status: { testVerified?: unknown }) {
  return status.testVerified === true;
}

export function campaignHasTestAttempt(status: { status?: unknown; testSmsAccepted?: unknown; testSendState?: unknown }) {
  return Boolean(status.testSmsAccepted) || ["sending", "delivery_unknown", "accepted"].includes(String(status.testSendState ?? "")) || ["test_sending", "test_delivery_unknown", "test_sent", "test_link_opened", "test_verified"].includes(String(status.status ?? ""));
}

export function isRestorableCampaignStatus(status: unknown) {
  return ["ready", "test_sending", "test_delivery_unknown", "test_sent", "test_link_opened", "test_verified", "scheduled", "sending"].includes(String(status ?? ""));
}

export function mergeCampaignVerificationStatus<T extends object>(current: T, status: object) {
  return { ...current, ...status };
}

export const campaignStatusNoStoreHeaders = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;
