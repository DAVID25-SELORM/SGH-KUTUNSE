import { describe, expect, it } from "vitest";
import { resolveMessagePreview, smsEncoding, smsSegmentCount, unknownMergeFields } from "@/lib/sms-message";
import { campaignMessageSchema } from "@/lib/feedback-campaigns";

describe("custom SMS messages", () => {
  it("requires the survey placeholder only for feedback", () => { expect(campaignMessageSchema.safeParse({ message: "Thank you for visiting us. [SURVEY LINK]", purpose: "feedback_request" }).success).toBe(true); expect(campaignMessageSchema.safeParse({ message: "Thank you for visiting our hospital today.", purpose: "feedback_request" }).success).toBe(false); expect(campaignMessageSchema.safeParse({ message: "Thank you for attending our screening today.", purpose: "health_screening_followup" }).success).toBe(true); });
  it("rejects unsupported fields and overlong content", () => { expect(unknownMergeFields("Hello [PATIENT ID]")).toEqual(["PATIENT ID"]); expect(campaignMessageSchema.safeParse({ message: `Hello [FIRST NAME] ${"a".repeat(500)}`, purpose: "service_followup" }).success).toBe(false); });
  it("uses safe merge fallbacks", () => { expect(resolveMessagePreview("Dear [FIRST NAME], visit on [DATE] at [TIME].")).not.toMatch(/undefined|\[FIRST NAME\]/); });
  it("estimates GSM and Unicode segments", () => { expect(smsEncoding("Hello")).toBe("GSM-7"); expect(smsSegmentCount("a".repeat(161))).toBe(2); expect(smsEncoding("Hello 👋")).toBe("Unicode"); expect(smsSegmentCount("😊".repeat(40))).toBeGreaterThan(1); });
});
