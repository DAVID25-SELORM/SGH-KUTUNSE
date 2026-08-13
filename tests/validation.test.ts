import { describe, expect, it } from "vitest";
import { feedbackSchema } from "@/lib/validation";
import { deduplicateRecipients, MockSmsProvider, normalizeGhanaPhone } from "@/lib/sms";
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

describe("patient feedback",()=>{const valid={visitType:"health_screening",visitDate:"2026-08-01",ratings:{reception:4,waitingTime:3,professionalism:5,cleanliness:4,communication:4,overallQuality:4},overallSatisfaction:"satisfied",recommendation:"definitely",receiptConcern:"no",contactRequested:false,source:"website",website:""};it("accepts anonymous feedback",()=>expect(feedbackSchema.safeParse(valid).success).toBe(true));it("rejects unknown fields",()=>expect(feedbackSchema.safeParse({...valid,patientId:"secret"}).success).toBe(false));it("requires dissatisfaction context",()=>expect(feedbackSchema.safeParse({...valid,overallSatisfaction:"very_dissatisfied"}).success).toBe(false));it("requires receipt details for a concern",()=>expect(feedbackSchema.safeParse({...valid,receiptConcern:"yes"}).success).toBe(false));it("requires contact channel when follow-up is requested",()=>expect(feedbackSchema.safeParse({...valid,contactRequested:true}).success).toBe(false));it("accepts non-identifying campaign attribution",()=>expect(feedbackSchema.safeParse({...valid,campaign:"screening_aug_2026",source:"sms"}).success).toBe(true));});
describe("Ghana phone normalization",()=>{it("normalizes local and international numbers",()=>{expect(normalizeGhanaPhone("024 123 4567")).toBe("+233241234567");expect(normalizeGhanaPhone("233541234567")).toBe("+233541234567")});it("rejects invalid numbers",()=>expect(normalizeGhanaPhone("12345")).toBeNull())});
describe("SMS safety",()=>{it("removes invalid and duplicate recipients",()=>expect(deduplicateRecipients(["0241234567","+233241234567","invalid"])).toEqual(["+233241234567"]));it("uses a non-delivering mock provider",async()=>{const provider=new MockSmsProvider();expect((await provider.sendBatch([{to:"+233241234567",message:"Test",idempotencyKey:"campaign-recipient"}]))[0]).toEqual({providerId:"mock-campaign-recipient",status:"mocked"})})});

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
    expect(hasPermission("viewer", "feedback")).toBe(true);
    expect(hasPermission("viewer", "feedback_manage")).toBe(false);
    expect(hasPermission("admin", "feedback_receipts")).toBe(false);
    expect(hasPermission("super_admin", "feedback_receipts")).toBe(true);
    expect(hasPermission("admin", "feedback_sms")).toBe(false);
    expect(hasPermission("super_admin", "feedback_sms")).toBe(true);
  });
  it("enforces safe submission transitions",()=>{expect(canTransition("new","in_review")).toBe(true);expect(canTransition("new","completed")).toBe(false);expect(canTransition("archived","completed")).toBe(false);expect(canTransition("completed","archived")).toBe(true)});
});
