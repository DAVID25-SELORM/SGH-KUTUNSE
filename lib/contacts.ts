import { z } from "zod";
import { normalizeGhanaPhone } from "./sms";

export const AGE_GROUPS = ["under_18", "18_24", "25_34", "35_44", "45_54", "55_64", "65_plus"] as const;
export const CONTACT_SOURCES = ["staff", "health_screening", "facility", "outpatient", "reception", "laboratory", "pharmacy", "other"] as const;
export const GENDERS = ["", "female", "male", "other", "prefer_not_to_say"] as const;

export const contactSchema = z.strictObject({
  fullName: z.string().trim().max(120).default(""), phone: z.string().trim().min(10).max(30), email: z.union([z.literal(""), z.email()]).default(""),
  gender: z.enum(GENDERS).default(""), dateOfBirth: z.string().trim().max(10).default(""), age: z.union([z.literal(""), z.coerce.number().int().min(0).max(125)]).default(""), ageGroup: z.enum(["", ...AGE_GROUPS]).default(""),
  source: z.enum(CONTACT_SOURCES), facility: z.string().trim().max(160).default(""), group: z.string().trim().max(160).default(""), tags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  smsOptIn: z.boolean().default(false), emailOptIn: z.boolean().default(false), doNotContact: z.boolean().default(false), notes: z.string().trim().max(3000).default(""), status: z.enum(["active", "archived"]).default("active"),
});
export const contactMergeSchema = z.strictObject({ targetId: z.string().regex(/^[a-f0-9]{64}$/) });

export function deriveAge(dateOfBirth: string, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const birth = new Date(`${dateOfBirth}T00:00:00Z`); if (Number.isNaN(birth.valueOf()) || birth > today) return null;
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  if (today.getUTCMonth() < birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) age--;
  return age >= 0 && age <= 125 ? age : null;
}
export function ageGroupFor(age: number | null) { if (age === null) return ""; if (age < 18) return "under_18"; if (age < 25) return "18_24"; if (age < 35) return "25_34"; if (age < 45) return "35_44"; if (age < 55) return "45_54"; if (age < 65) return "55_64"; return "65_plus"; }
export function prepareContact(input: z.output<typeof contactSchema>) {
  const normalizedPhone = normalizeGhanaPhone(input.phone); if (!normalizedPhone) throw new Error("Enter a valid Ghana mobile number.");
  const derived = input.dateOfBirth ? deriveAge(input.dateOfBirth) : null; if (input.dateOfBirth && derived === null) throw new Error("Enter a valid date of birth.");
  const age = derived ?? (input.age === "" ? null : input.age); const ageGroup = age !== null ? ageGroupFor(age) : input.ageGroup;
  return { ...input, phone: normalizedPhone, normalizedPhone, age, ageGroup, sources: [input.source], tags: [...new Set(input.tags.map(tag => tag.toLowerCase()))] };
}

export type AudienceFilters = { gender?: string; ageGroups?: string[]; source?: string; facility?: string; group?: string; tags?: string[]; smsConsent?: boolean; hasPhone?: boolean; excludeContactedSince?: string };
export function contactMatchesAudience(contact: Record<string, unknown>, filters: AudienceFilters, now = new Date()) {
  if (contact.status !== "active" || contact.doNotContact === true) return false;
  if (filters.smsConsent && contact.smsOptIn !== true) return false;
  if (filters.hasPhone && !normalizeGhanaPhone(String(contact.normalizedPhone ?? contact.phone ?? ""))) return false;
  if (filters.gender && filters.gender !== "all" && contact.gender !== filters.gender) return false;
  if (filters.ageGroups?.length && !filters.ageGroups.includes(String(contact.ageGroup ?? ""))) return false;
  if (filters.source && filters.source !== "all_contacts" && ![contact.source, ...(Array.isArray(contact.sources) ? contact.sources : [])].includes(filters.source)) return false;
  if (filters.facility && String(contact.facility ?? "").toLowerCase() !== filters.facility.toLowerCase()) return false;
  if (filters.group && String(contact.group ?? "").toLowerCase() !== filters.group.toLowerCase()) return false;
  const tags = Array.isArray(contact.tags) ? contact.tags.map(String) : []; if (filters.tags?.length && !filters.tags.every(tag => tags.includes(tag.toLowerCase()))) return false;
  if (filters.excludeContactedSince) { const last = (contact.lastContactedAt as { toDate?: () => Date })?.toDate?.() ?? (contact.lastContactedAt ? new Date(String(contact.lastContactedAt)) : null); const cutoff = new Date(filters.excludeContactedSince); if (last && last >= cutoff && cutoff <= now) return false; }
  return true;
}
