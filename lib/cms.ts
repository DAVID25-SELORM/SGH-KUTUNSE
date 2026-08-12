import { z } from "zod";
const text=(min:number,max:number)=>z.string().trim().min(min).max(max);
const optional=(max:number)=>z.string().trim().max(max).optional().or(z.literal(""));
const slug=z.string().trim().toLowerCase().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const image=z.strictObject({url:optional(500),alt:optional(200)}).optional();
const order=z.coerce.number().int().min(0).max(10000);
export const cmsDefinitions={
  doctors:{collection:"doctors",label:"Doctors",schema:z.strictObject({fullName:text(2,120),slug,specialty:text(2,120),qualifications:optional(500),biography:optional(5000),availability:optional(1000),image,displayOrder:order,status:z.enum(["draft","published","archived"]),verified:z.boolean()})},
  services:{collection:"services",label:"Services",schema:z.strictObject({title:text(2,160),slug,shortDescription:text(10,500),fullDescription:text(20,10000),image,displayOrder:order,status:z.enum(["draft","published","archived"])})},
  articles:{collection:"articles",label:"Health articles",schema:z.strictObject({title:text(2,200),slug,summary:text(10,500),body:text(20,30000),author:text(2,150),image,publishedAt:optional(40),status:z.enum(["draft","review_ready","published","archived"])})},
  "insurance-partners":{collection:"insurance_partners",label:"Insurance partners",schema:z.strictObject({name:text(2,160),slug,details:optional(2000),image,displayOrder:order,status:z.enum(["draft","published","archived"]),verified:z.boolean()})},
  "site-settings":{collection:"website_settings",label:"Site settings",schema:z.strictObject({phones:z.array(text(7,30)).min(1).max(5),email:z.string().trim().email().max(254),address:text(5,500),operatingHours:text(2,500),emergencyInformation:text(5,1000),socialLinks:z.array(z.string().trim().url().max(500)).max(10),footerDetails:text(5,1000),public:z.boolean()})},
} as const;
export type CmsSection=keyof typeof cmsDefinitions;
export function isCmsSection(value:string):value is CmsSection{return value in cmsDefinitions}
