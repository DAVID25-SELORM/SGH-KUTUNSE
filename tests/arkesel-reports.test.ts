import { describe, expect, it } from "vitest";
import { parseArkeselDeliveryReports } from "@/lib/sms-delivery";

describe("Arkesel delivery reports", () => {
  it("reads the live batch report message_status field", async () => {
    expect(parseArkeselDeliveryReports({
      "message-1": { message_status: "DELIVERED" },
      "message-2": { message_status: "NOT_DELIVERED" },
    })).toEqual([
      { providerId: "message-1", status: "DELIVERED" },
      { providerId: "message-2", status: "NOT_DELIVERED" },
    ]);
  });

  it("continues to accept the documented status field", async () => {
    expect(parseArkeselDeliveryReports({
      "message-1": { status: "SUBMITTED" },
    })).toEqual([
      { providerId: "message-1", status: "SUBMITTED" },
    ]);
  });
});
