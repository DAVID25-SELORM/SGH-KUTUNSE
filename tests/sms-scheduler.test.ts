import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { cloudTaskResourceName, formatAccraSchedule, parseAccraSchedule, validateSmsSchedule, withinSmsHours } from "@/lib/server/sms-scheduler";
import { DEFAULT_SMS_POLICY } from "@/lib/sms-policy";

const restricted = { ...DEFAULT_SMS_POLICY, sendingRestrictionEnabled: true };

describe("SMS scheduler", () => {
  it("parses Accra local time without a timezone shift", () => expect(parseAccraSchedule("2026-08-20", "10:30")?.toISOString()).toBe("2026-08-20T10:30:00.000Z"));
  it("rejects malformed and past schedules", () => { expect(parseAccraSchedule("bad", "10:00")).toBeNull(); expect(validateSmsSchedule("2026-08-14", "10:00", DEFAULT_SMS_POLICY, new Date("2026-08-14T10:00:00Z")).ok).toBe(false); });
  it("enforces hospital sending hours", () => { expect(withinSmsHours(new Date("2026-08-20T07:59:00Z"), restricted)).toBe(false); expect(withinSmsHours(new Date("2026-08-20T08:00:00Z"), restricted)).toBe(true); expect(withinSmsHours(new Date("2026-08-20T19:00:00Z"), restricted)).toBe(false); });
  it("accepts a future daytime schedule and formats its timezone", () => { expect(validateSmsSchedule("2026-08-20", "10:30", restricted, new Date("2026-08-20T09:00:00Z")).ok).toBe(true); expect(formatAccraSchedule(new Date("2026-08-20T10:30:00Z"))).toMatch(/10:30.*GMT/); });
  it("normalizes the short Cloud Tasks request header to the persisted resource name", () => {
    expect(cloudTaskResourceName("campaign-test-1")).toBe("projects/satelitegeneralhospital/locations/us-east4/queues/sgh-sms-schedules/tasks/campaign-test-1");
  });
});
