import { describe, expect, it } from "vitest";
import { DEFAULT_SMS_POLICY, isDateWithinSmsPolicy, isTimeWithinSmsPolicy, smsPolicySchema } from "@/lib/sms-policy";
import { hasPermission } from "@/lib/types/admin";

describe("centrally managed SMS policy", () => {
  it("defaults to restriction off and allows send now", () => {
    expect(DEFAULT_SMS_POLICY.sendingRestrictionEnabled).toBe(false);
    expect(isDateWithinSmsPolicy(new Date("2026-08-20T02:00:00Z"), DEFAULT_SMS_POLICY)).toBe(true);
  });
  it("allows a 02:00 schedule when restriction is off", () => expect(isTimeWithinSmsPolicy("02:00", DEFAULT_SMS_POLICY)).toBe(true));
  it("accepts inside and rejects before/after a daytime window", () => {
    const policy = { ...DEFAULT_SMS_POLICY, sendingRestrictionEnabled: true, sendingStartTime: "06:00", sendingEndTime: "22:00" };
    expect(isTimeWithinSmsPolicy("06:00", policy)).toBe(true);
    expect(isTimeWithinSmsPolicy("05:59", policy)).toBe(false);
    expect(isTimeWithinSmsPolicy("22:00", policy)).toBe(false);
  });
  it("supports overnight windows", () => {
    const policy = { ...DEFAULT_SMS_POLICY, sendingRestrictionEnabled: true, sendingStartTime: "22:00", sendingEndTime: "06:00" };
    expect(isTimeWithinSmsPolicy("23:30", policy)).toBe(true);
    expect(isTimeWithinSmsPolicy("05:59", policy)).toBe(true);
    expect(isTimeWithinSmsPolicy("12:00", policy)).toBe(false);
  });
  it("rejects invalid and same time inputs", () => {
    expect(smsPolicySchema.safeParse({ ...DEFAULT_SMS_POLICY, sendingRestrictionEnabled: true, sendingStartTime: "25:00" }).success).toBe(false);
    expect(smsPolicySchema.safeParse({ ...DEFAULT_SMS_POLICY, sendingRestrictionEnabled: true, sendingEndTime: DEFAULT_SMS_POLICY.sendingStartTime }).success).toBe(false);
  });
  it("limits mutation to super administrators", () => {
    expect(hasPermission("super_admin", "sms_settings_write")).toBe(true);
    expect(hasPermission("admin", "sms_settings_view")).toBe(true);
    expect(hasPermission("admin", "sms_settings_write")).toBe(false);
  });
  it("re-evaluates a changed policy at execution time", () => {
    const scheduledUnder = DEFAULT_SMS_POLICY;
    const current = { ...DEFAULT_SMS_POLICY, sendingRestrictionEnabled: true, sendingStartTime: "06:00", sendingEndTime: "19:00" };
    const execution = new Date("2026-08-21T21:00:00Z");
    expect(isDateWithinSmsPolicy(execution, scheduledUnder)).toBe(true);
    expect(isDateWithinSmsPolicy(execution, current)).toBe(false);
  });
});
