import { describe, expect, it } from "vitest";
import { feedbackEventLabel, feedbackStatusLabel, formatFeedbackDate, formatGhs, humanizeFeedbackValue } from "@/lib/feedback-display";

describe("feedback detail presentation", () => {
  it("humanizes stored enum and boolean values", () => {
    expect(humanizeFeedbackValue("health_screening")).toBe("Health Screening");
    expect(humanizeFeedbackValue("very_satisfied")).toBe("Very Satisfied");
    expect(humanizeFeedbackValue(true)).toBe("Yes");
    expect(humanizeFeedbackValue(false)).toBe("No");
    expect(humanizeFeedbackValue("")).toBe("Not provided");
  });
  it("uses operational workflow labels", () => {
    expect(feedbackStatusLabel("completed")).toBe("Resolved");
    expect(feedbackEventLabel("reviewed")).toBe("Marked as reviewed");
  });
  it("formats receipt amounts as Ghana cedis", () => {
    expect(formatGhs("1250")).toContain("1,250.00");
    expect(formatGhs(undefined)).toBe("Not provided");
  });
  it("handles present and missing dates", () => {
    expect(formatFeedbackDate("2026-08-14")).toContain("14 Aug 2026");
    expect(formatFeedbackDate(undefined)).toBe("Not provided");
  });
});
