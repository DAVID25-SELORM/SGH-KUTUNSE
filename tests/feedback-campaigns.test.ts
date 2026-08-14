import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { campaignCreateSchema, campaignLink, defaultFeedbackMessage, parseRecipientImport, recipientKey } from "@/lib/feedback-campaigns";
import { MockSmsProvider } from "@/lib/sms";
import { ArkeselSmsProvider } from "@/lib/server/sms";
describe("feedback campaigns",()=>{
 it("normalizes and deduplicates",()=>{const r=parseRecipientImport("0241234567, +233241234567\ninvalid");expect(r.recipients).toEqual(["+233241234567"]);expect(r.invalidCount).toBe(1);expect(r.duplicateCount).toBe(1)});
 it("uses stable opaque keys",()=>{expect(recipientKey("+233241234567")).toBe(recipientKey("+233241234567"));expect(recipientKey("+233241234567")).not.toContain("241234567")});
 it("requires a safe template",()=>{expect(campaignCreateSchema.safeParse({name:"OPD feedback",source:"outpatient",message:defaultFeedbackMessage}).success).toBe(true);expect(campaignCreateSchema.safeParse({name:"OPD feedback",source:"outpatient",message:"Your diagnosis is ready [SURVEY LINK]"}).success).toBe(false)});
 it("creates non-identifying links",()=>{const link=campaignLink("opaque-code","health_screening");expect(link).toContain("campaign=opaque-code");expect(link).not.toMatch(/phone|patient/i)});
 it("keeps mock sending non-live",async()=>{const p=new MockSmsProvider();expect(p.mode).toBe("mock");expect(await p.sendMessage("+233241234567","hello","key")).toEqual({providerId:"mock-key",status:"mocked"})});
 it("sends Arkesel tests in sandbox mode",async()=>{const original=global.fetch;global.fetch=async(_input,init)=>{expect((init?.headers as Record<string,string>)["api-key"]).toBe("secret");expect(JSON.parse(String(init?.body))).toMatchObject({sender:"SGH-KUTUNSE",recipients:["+233241234567"],sandbox:true});return new Response(JSON.stringify({status:"success",data:[{recipient:"233241234567",id:"sms-1"}]}),{status:200,headers:{"Content-Type":"application/json"}})};try{const p=new ArkeselSmsProvider(" secret\r\n","SGH-KUTUNSE",true);expect(p.mode).toBe("sandbox");expect(await p.sendMessage("+233241234567","hello","key")).toEqual({providerId:"sms-1",status:"mocked"})}finally{global.fetch=original}});
});
