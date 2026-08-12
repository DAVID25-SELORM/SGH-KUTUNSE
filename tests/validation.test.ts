import { describe, expect, it } from "vitest";
import { appointmentSchema, contactSchema, insuranceVerificationSchema, telemedicineRequestSchema } from "../lib/validation";
import { createReference } from "../lib/reference";
import { hasPermission, canMutate } from "../lib/types/admin";
import { canTransition } from "../lib/types/submissions";

describe("public validation", () => {
  it("rejects unknown fields", () => expect(contactSchema.safeParse({ fullName: "Jane Doe", phone: "024 000 0000", message: "A valid message here", unexpected: "x" }).success).toBe(false));
  it("limits sensitive member IDs", () => expect(insuranceVerificationSchema.safeParse({ fullName: "Jane Doe", phone: "024 000 0000", insurer: "Test", memberId: "x".repeat(81), serviceNeeded: "Consultation" }).success).toBe(false));
  it("requires telemedicine consent", () => expect(telemedicineRequestSchema.safeParse({ fullName: "Jane Doe", phone: "024 000 0000", request: "Please contact me", consent: false }).success).toBe(false));
  it("validates appointment dates", () => expect(appointmentSchema.safeParse({}).success).toBe(false));
});

describe("security utilities", () => {
  it("generates non-document references", () => expect(createReference("APT")).toMatch(/^SGH-APT-[A-F0-9]{12}$/));
  it("separates role permissions", () => {
    expect(hasPermission("reception", "appointments")).toBe(true);
    expect(hasPermission("reception", "insurance")).toBe(false);
    expect(hasPermission("content_editor", "content")).toBe(true);
  });
  it("enforces the complete role matrix", () => {
    expect(canMutate("viewer")).toBe(false);
    expect(hasPermission("reception", "contact")).toBe(true);
    expect(hasPermission("reception", "corporate")).toBe(false);
    expect(hasPermission("insurance", "insurance")).toBe(true);
    expect(hasPermission("insurance", "appointments")).toBe(false);
    expect(hasPermission("corporate", "corporate")).toBe(true);
    expect(hasPermission("corporate", "contact")).toBe(false);
    expect(hasPermission("content_editor", "content")).toBe(true);
    expect(hasPermission("content_editor", "appointments")).toBe(false);
    expect(hasPermission("admin", "audit")).toBe(true);
    expect(hasPermission("admin", "users")).toBe(false);
    expect(hasPermission("super_admin", "users")).toBe(true);
  });
  it("enforces safe submission transitions",()=>{expect(canTransition("new","in_review")).toBe(true);expect(canTransition("new","completed")).toBe(false);expect(canTransition("archived","completed")).toBe(false);expect(canTransition("completed","archived")).toBe(true)});
});
