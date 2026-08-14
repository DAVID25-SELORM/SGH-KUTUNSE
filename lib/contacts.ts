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
export type AudienceContact = Record<string, unknown> & { id: string };
export type AudienceCalculation = { totalContacts: number; filterMatches: number; active: number; validMobile: number; smsConsent: number; eligible: number; noConsent: number; invalidPhone: number; optedOut: number; doNotContact: number; duplicates: number; otherExclusions: number };

export function contactMatchesCampaignFilters(contact: Record<string, unknown>, filters: AudienceFilters, now = new Date()) {
  if (filters.gender && filters.gender !== "all" && contact.gender !== filters.gender) return false;
  if (filters.ageGroups?.length && !filters.ageGroups.includes(String(contact.ageGroup ?? ""))) return false;
  if (filters.source && !["all_contacts", "custom_list"].includes(filters.source) && ![contact.source, ...(Array.isArray(contact.sources) ? contact.sources : [])].includes(filters.source)) return false;
  if (filters.facility && String(contact.facility ?? "").toLowerCase() !== filters.facility.toLowerCase()) return false;
  if (filters.group && String(contact.group ?? "").toLowerCase() !== filters.group.toLowerCase()) return false;
  const tags = Array.isArray(contact.tags) ? contact.tags.map(String) : [];
  if (filters.tags?.length && !filters.tags.every(tag => tags.includes(tag.toLowerCase()))) return false;
  if (filters.excludeContactedSince) { const last = (contact.lastContactedAt as { toDate?: () => Date })?.toDate?.() ?? (contact.lastContactedAt ? new Date(String(contact.lastContactedAt)) : null); const cutoff = new Date(filters.excludeContactedSince); if (last && last >= cutoff && cutoff <= now) return false; }
  return true;
}

export function resolveSmsAudience(contacts: AudienceContact[], filters: AudienceFilters, optedOutIds = new Set<string>(), now = new Date()) {
  const matching = contacts.filter(contact => contactMatchesCampaignFilters(contact, filters, now));
  const result: AudienceCalculation = { totalContacts: contacts.length, filterMatches: matching.length, active: 0, validMobile: 0, smsConsent: 0, eligible: 0, noConsent: 0, invalidPhone: 0, optedOut: 0, doNotContact: 0, duplicates: 0, otherExclusions: 0 };
  const seenPhones = new Set<string>();
  const eligibleContacts: AudienceContact[] = [];
  for (const contact of matching) {
    if (contact.status !== "active") { result.otherExclusions++; continue; }
    result.active++;
    const phone = normalizeGhanaPhone(String(contact.normalizedPhone ?? contact.phone ?? ""));
    if (!phone) { result.invalidPhone++; continue; }
    result.validMobile++;
    if (contact.smsOptIn === true) result.smsConsent++;
    if (contact.doNotContact === true) { result.doNotContact++; continue; }
    if (contact.smsOptIn !== true) { result.noConsent++; continue; }
    const key = contact.id || phone;
    if (optedOutIds.has(key)) { result.optedOut++; continue; }
    if (seenPhones.has(phone)) { result.duplicates++; continue; }
    seenPhones.add(phone); result.eligible++; eligibleContacts.push(contact);
  }
  return { summary: result, eligibleContacts };
}
export function calculateSmsAudience(contacts: AudienceContact[], filters: AudienceFilters, optedOutIds = new Set<string>(), now = new Date()) { return resolveSmsAudience(contacts, filters, optedOutIds, now).summary; }
export type ContactDirectoryFilters = { q?: string; source?: string; gender?: string; ageGroup?: string; facility?: string; tag?: string; consent?: string; status?: string };
export function contactMatchesDirectoryFilters(contact: Record<string, unknown>, filters: ContactDirectoryFilters) {
  const q = String(filters.q ?? "").trim().toLowerCase();
  return (!q || [contact.fullName, contact.name, contact.phone, contact.email, contact.reference].some(value => String(value ?? "").toLowerCase().includes(q))) &&
    (!filters.source || contact.source === filters.source || (Array.isArray(contact.sources) && contact.sources.includes(filters.source))) &&
    (!filters.gender || contact.gender === filters.gender) && (!filters.ageGroup || contact.ageGroup === filters.ageGroup) &&
    (!filters.facility || String(contact.facility ?? "").toLowerCase().includes(filters.facility.toLowerCase())) &&
    (!filters.tag || (Array.isArray(contact.tags) && contact.tags.map(String).some(tag => tag.toLowerCase().includes(filters.tag!.toLowerCase())))) &&
    (!filters.consent || (filters.consent === "sms" ? contact.smsOptIn === true : filters.consent === "email" ? contact.emailOptIn === true : contact.doNotContact === true)) &&
    (!filters.status || contact.status === filters.status);
}
export function isSmsEligibleContact(contact: Record<string, unknown>) {
  return contact.status === "active" && contact.smsOptIn === true && contact.doNotContact !== true && Boolean(normalizeGhanaPhone(String(contact.normalizedPhone ?? contact.phone ?? "")));
}
export function contactMatchesAudience(contact: Record<string, unknown>, filters: AudienceFilters, now = new Date()) {
  if (contact.status !== "active" || contact.doNotContact === true) return false;
  if (filters.smsConsent && contact.smsOptIn !== true) return false;
  if (filters.hasPhone && !normalizeGhanaPhone(String(contact.normalizedPhone ?? contact.phone ?? ""))) return false;
  return contactMatchesCampaignFilters(contact, filters, now);
}
