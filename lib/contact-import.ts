import { z } from "@/lib/zod";
import { CONTACT_SOURCES, SMS_CONSENT_SCOPES, contactSchema, prepareContact } from "@/lib/contacts";

export const IMPORT_FIELDS = ["fullName", "firstName", "lastName", "phone", "email", "gender", "age", "dateOfBirth", "source", "facility", "group", "tags", "consent", "consentSource", "consentScope", "consentEvidence", "notes"] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];
export const MAX_IMPORT_ROWS = 5000;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

const aliases: Record<ImportField, string[]> = {
  fullName: ["name", "full name", "fullname", "contact name"], firstName: ["first name", "firstname", "given name"], lastName: ["last name", "lastname", "surname"],
  phone: ["phone", "phone number", "telephone", "mobile", "mobile number", "tel"], email: ["email", "email address"], gender: ["gender", "sex"], age: ["age"], dateOfBirth: ["date of birth", "dob", "birth date"],
  source: ["category", "contact category", "source"], facility: ["facility", "screening event", "event"], group: ["group", "department"], tags: ["tags", "tag"], consent: ["consent", "sms consent", "sms opt in"],
  consentSource: ["consent source"], consentScope: ["consent scope", "scope"], consentEvidence: ["consent evidence", "evidence", "reference note"], notes: ["notes", "note"],
};
const normal = (value: unknown) => String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
export function autoMapContactColumns(headers: string[]) {
  const result: Partial<Record<ImportField, string>> = {};
  for (const field of IMPORT_FIELDS) { const match = headers.find(header => aliases[field].includes(normal(header))); if (match) result[field] = match; }
  return result;
}

export const importRequestSchema = z.strictObject({
  filename: z.string().trim().min(1).max(255), rows: z.array(z.record(z.string(), z.unknown())).min(1).max(MAX_IMPORT_ROWS),
  mapping: z.partialRecord(z.enum(IMPORT_FIELDS), z.string().trim().max(120)), categoryMode: z.enum(["file", "all"]), category: z.enum(CONTACT_SOURCES).optional(), sourceLabel: z.string().trim().max(80).default(""),
  existingMode: z.enum(["skip", "update_missing"]).default("skip"), consentMode: z.enum(["none", "file", "batch"]).default("none"), consentSource: z.enum(CONTACT_SOURCES).optional(), consentScope: z.enum(SMS_CONSENT_SCOPES).optional(), consentEvidence: z.string().trim().max(500).default(""), confirmed: z.boolean().default(false),
});
export type ContactImportRequest = z.output<typeof importRequestSchema>;
export type ContactImportRow = { rowNumber: number; state: "new" | "existing" | "duplicate" | "invalid"; id?: string; contact?: ReturnType<typeof prepareContact>; reasons: string[] };

function value(row: Record<string, unknown>, mapping: Partial<Record<ImportField, string>>, field: ImportField) { const heading = mapping[field]; return heading ? String(row[heading] ?? "").trim() : ""; }
const categoryValue = (raw: string) => normal(raw).replaceAll(" ", "_");
export function validateContactImport(input: ContactImportRequest, existingIds = new Set<string>(), idForPhone: (phone: string) => string): ContactImportRow[] {
  const seen = new Set<string>();
  return input.rows.map((raw, index) => {
    const reasons: string[] = [], rowNumber = index + 2;
    const sourceRaw = input.categoryMode === "all" ? input.category ?? "" : categoryValue(value(raw, input.mapping, "source"));
    if (!CONTACT_SOURCES.includes(sourceRaw as (typeof CONTACT_SOURCES)[number])) reasons.push(sourceRaw ? `Invalid category: ${sourceRaw}` : "Missing category");
    const fullName = value(raw, input.mapping, "fullName") || [value(raw, input.mapping, "firstName"), value(raw, input.mapping, "lastName")].filter(Boolean).join(" ");
    if (!fullName) reasons.push("Missing full name");
    const affirmative = /^(yes|true|1|opted[_ -]?in|consented)$/i.test(value(raw, input.mapping, "consent"));
    const fileConsentSource = categoryValue(value(raw, input.mapping, "consentSource"));
    const fileConsentScope = categoryValue(value(raw, input.mapping, "consentScope"));
    const consentSource = input.consentMode === "batch" ? input.consentSource ?? "" : fileConsentSource;
    const consentScope = input.consentMode === "batch" ? input.consentScope ?? "" : fileConsentScope;
    const evidence = input.consentMode === "batch" ? input.consentEvidence : value(raw, input.mapping, "consentEvidence");
    const optedIn = input.consentMode === "batch" || (input.consentMode === "file" && affirmative);
    if (optedIn && (!consentSource || !CONTACT_SOURCES.includes(consentSource as never) || !consentScope || !SMS_CONSENT_SCOPES.includes(consentScope as never) || !evidence)) reasons.push("Verified consent requires valid source, scope and evidence");
    let contact: ReturnType<typeof prepareContact> | undefined;
    try {
      const parsed = contactSchema.parse({ fullName, phone: value(raw, input.mapping, "phone"), email: value(raw, input.mapping, "email"), gender: categoryValue(value(raw, input.mapping, "gender")), dateOfBirth: value(raw, input.mapping, "dateOfBirth"), age: value(raw, input.mapping, "age"), ageGroup: "", source: sourceRaw, sourceLabel: sourceRaw === "other" ? input.sourceLabel : "", facility: value(raw, input.mapping, "facility"), group: value(raw, input.mapping, "group"), tags: value(raw, input.mapping, "tags").split(/[,;]/).map(x => x.trim()).filter(Boolean), smsOptIn: optedIn, smsConsentStatus: optedIn ? "opted_in" : "unknown", smsConsentSource: optedIn ? consentSource : "", smsConsentScope: optedIn ? [consentScope] : [], smsConsentDate: "", smsConsentEvidenceNote: optedIn ? evidence : "", emailOptIn: false, doNotContact: false, notes: value(raw, input.mapping, "notes"), status: "active" });
      contact = prepareContact(parsed);
    } catch (error) { reasons.push(error instanceof Error ? error.message : "Invalid contact"); }
    if (reasons.length || !contact) return { rowNumber, state: "invalid", reasons };
    const id = idForPhone(contact.normalizedPhone);
    if (seen.has(id)) return { rowNumber, state: "duplicate", id, contact, reasons: ["Duplicate phone number within file"] };
    seen.add(id);
    return { rowNumber, state: existingIds.has(id) ? "existing" : "new", id, contact, reasons: [] };
  });
}
