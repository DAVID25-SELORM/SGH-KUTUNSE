import { describe, expect, it } from "vitest";
import { campaignCreateSchema, campaignLink, defaultFeedbackMessage, parseRecipientImport, recipientKey } from "@/lib/feedback-campaigns";
import { MockSmsProvider } from "@/lib/sms";
describe("feedback campaigns",()=>{
 it("normalizes and deduplicates",()=>{const r=parseRecipientImport("0241234567, +233241234567\ninvalid");expect(r.recipients).toEqual(["+233241234567"]);expect(r.invalidCount).toBe(1);expect(r.duplicateCount).toBe(1)});
 it("uses stable opaque keys",()=>{expect(recipientKey("+233241234567")).toBe(recipientKey("+233241234567"));expect(recipientKey("+233241234567")).not.toContain("241234567")});
 it("requires a safe template",()=>{expect(campaignCreateSchema.safeParse({name:"OPD feedback",source:"outpatient",message:defaultFeedbackMessage}).success).toBe(true);expect(campaignCreateSchema.safeParse({name:"OPD feedback",source:"outpatient",message:"Your diagnosis is ready [SURVEY LINK]"}).success).toBe(false)});
 it("creates non-identifying links",()=>{const link=campaignLink("opaque-code","health_screening");expect(link).toContain("campaign=opaque-code");expect(link).not.toMatch(/phone|patient/i)});
 it("keeps mock sending non-live",async()=>{const p=new MockSmsProvider();expect(p.mode).toBe("mock");expect(await p.sendMessage("+233241234567","hello","key")).toEqual({providerId:"mock-key",status:"mocked"})});
});
