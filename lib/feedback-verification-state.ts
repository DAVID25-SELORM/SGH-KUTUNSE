export function campaignVerificationStatus(data: Record<string, unknown>) {
  return {
    status: String(data.status ?? "draft"),
    testSmsAccepted: Boolean(data.testSmsAcceptedAt),
    testLinkOpened: Boolean(data.testLinkOpenedAt),
    testFeedbackSubmitted: Boolean(data.testFeedbackSubmittedAt),
    testVerified: data.testVerified === true,
  };
}

export function campaignTestActionsEnabled(status: { testVerified?: unknown }) {
  return status.testVerified === true;
}

export function mergeCampaignVerificationStatus<T extends object>(current: T, status: object) {
  return { ...current, ...status };
}

export const campaignStatusNoStoreHeaders = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;
