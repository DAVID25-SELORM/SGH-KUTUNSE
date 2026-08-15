import { describe, expect, it } from "vitest";
import { firstUnseenNotificationId, notificationCopy, notificationTarget, notificationTypes, readSeenNotificationIds } from "@/lib/notifications";

describe("admin notifications", () => {
  it("covers every public submission type", () => { expect(notificationTypes).toEqual(["appointments", "contact", "corporate", "insurance", "telemedicine", "feedback"]); notificationTypes.forEach((type) => expect(notificationCopy[type].title).toMatch(/^New /)); });
  it("routes to the source record without sensitive metadata", () => { expect(notificationTarget("appointments", "safe-id")).toBe("/admin/appointments/safe-id"); expect(JSON.stringify(notificationCopy)).not.toMatch(/phone|diagnosis|password/i); });
  it("plays only for a genuinely new notification and tolerates stale storage", () => {
    expect(firstUnseenNotificationId(["new", "old"], readSeenNotificationIds('["old"]'))).toBe("new");
    expect(firstUnseenNotificationId(["old"], readSeenNotificationIds('["old"]'))).toBeUndefined();
    expect(readSeenNotificationIds("not-json").size).toBe(0);
  });
});
