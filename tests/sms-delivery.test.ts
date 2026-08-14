import { describe, expect, it } from "vitest";
import { counterDelta, mapArkeselDeliveryStatus, resolveDeliveryTransition } from "@/lib/sms-delivery";

describe("Arkesel delivery reconciliation", () => {
  it.each([
    ["DELIVERED", "delivered"], ["SUBMITTED", "sent"], ["QUEUED", "sent"],
    ["PROHIBITED", "failed"], ["NOT_DELIVERED", "failed"], ["EXPIRED", "failed"],
  ])("maps %s safely", (provider, internal) => expect(mapArkeselDeliveryStatus(provider)).toBe(internal));

  it("ignores undocumented provider states", () => expect(mapArkeselDeliveryStatus("UNKNOWN_VENDOR_STATE")).toBeNull());
  it("promotes provider accepted to delivered", () => expect(resolveDeliveryTransition("sent", "DELIVERED")?.status).toBe("delivered"));
  it("changes provider accepted to failed", () => expect(resolveDeliveryTransition("sent", "NOT_DELIVERED")?.status).toBe("failed"));
  it("confirms interrupted unknown as delivered", () => expect(resolveDeliveryTransition("interrupted_delivery_unknown", "DELIVERED")?.status).toBe("delivered"));
  it("confirms interrupted unknown as failed", () => expect(resolveDeliveryTransition("interrupted_delivery_unknown", "EXPIRED")?.status).toBe("failed"));
  it("is idempotent for duplicate callbacks or lookups", () => expect(resolveDeliveryTransition("delivered", "DELIVERED")).toBeNull());
  it("does not downgrade delivered on an out-of-order status", () => expect(resolveDeliveryTransition("delivered", "SUBMITTED")).toBeNull());
  it("does not downgrade terminal failure to a queue state", () => expect(resolveDeliveryTransition("failed", "QUEUED")).toBeNull());
  it("keeps campaign counters consistent", () => expect(counterDelta("sent", "delivered")).toEqual({ acceptedCount: -1, deliveredCount: 1, failedCount: 0, unknownCount: 0 }));
});
