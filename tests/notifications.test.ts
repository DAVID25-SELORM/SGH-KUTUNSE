import { describe, expect, it } from "vitest";
import { notificationCopy, notificationTarget, notificationTypes } from "@/lib/notifications";

describe("admin notifications", () => {
  it("covers every public submission type", () => { expect(notificationTypes).toEqual(["appointments", "contact", "corporate", "insurance", "telemedicine", "feedback"]); notificationTypes.forEach((type) => expect(notificationCopy[type].title).toMatch(/^New /)); });
  it("routes to the source record without sensitive metadata", () => { expect(notificationTarget("appointments", "safe-id")).toBe("/admin/appointments/safe-id"); expect(JSON.stringify(notificationCopy)).not.toMatch(/phone|diagnosis|password/i); });
});
