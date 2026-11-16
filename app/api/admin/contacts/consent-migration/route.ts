import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "@/lib/zod";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";
import { previewScreeningConsentMigration, previewServiceConsentMigration, SCREENING_CONSENT_SCOPES, SERVICE_CONSENT_SCOPE } from "@/lib/server/consent-migration";

const schema = z.strictObject({ action: z.enum(["preview", "apply"]), confirmation: z.string().trim().max(100).default(""), migration: z.enum(["screening", "service"]).default("screening"), evidence: z.string().trim().max(500).default("") });

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("contacts_manage");
  if (!actor || !actor.roles.includes("super_admin")) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, schema); if (parsed.error) return parsed.error;
  try {
    if (parsed.data.migration === "service") {
      const preview = await previewServiceConsentMigration();
      if (parsed.data.action === "preview") return NextResponse.json({ ok: true, ...preview.summary });
      const expected = `APPLY GENERAL BROADCAST CONSENT TO ${preview.summary.contactsToMarkConsented}`;
      if (parsed.data.evidence.length < 20) return NextResponse.json({ ok: false, message: "Describe the documented basis for this consent (at least 20 characters)." }, { status: 400 });
      if (!preview.summary.contactsToMarkConsented || parsed.data.confirmation !== expected) return NextResponse.json({ ok: false, message: `Type ${expected} to confirm the current preview.` }, { status: 409 });
      for (let offset = 0; offset < preview.candidates.length; offset += 400) {
        const batch = adminDb.batch();
        preview.candidates.slice(offset, offset + 400).forEach(contact => {
          const existing = Array.isArray(contact.data.smsConsentScope) ? contact.data.smsConsentScope.map(String) : [];
          batch.update(contact.ref, { smsConsentScope: [...new Set([...existing, SERVICE_CONSENT_SCOPE])], serviceConsentEvidenceNote: parsed.data.evidence, serviceConsentRecordedBy: actor.uid, serviceConsentRecordedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
        });
        await batch.commit();
      }
      await writeAudit(actor.uid, "contact.consent_bulk_migrated", "feedback_contact", "general-broadcast-consent", { count: String(preview.summary.contactsToMarkConsented), scope: SERVICE_CONSENT_SCOPE, evidence: parsed.data.evidence });
      return NextResponse.json({ ok: true, applied: preview.summary.contactsToMarkConsented, ...preview.summary });
    }
    const preview = await previewScreeningConsentMigration();
    if (parsed.data.action === "preview") return NextResponse.json({ ok: true, ...preview.summary });
    const expected = `APPLY HEALTH SCREENING CONSENT TO ${preview.summary.contactsToMarkConsented}`;
    if (!preview.summary.contactsToMarkConsented || parsed.data.confirmation !== expected) return NextResponse.json({ ok: false, message: `Type ${expected} to confirm the current preview.` }, { status: 409 });
    for (let offset = 0; offset < preview.candidates.length; offset += 400) {
      const batch = adminDb.batch();
      preview.candidates.slice(offset, offset + 400).forEach(contact => batch.update(contact.ref, {
        smsOptIn: true,
        smsConsentStatus: "opted_in",
        smsConsentSource: "health_screening",
        smsConsentScope: [...SCREENING_CONSENT_SCOPES],
        smsConsentEvidenceNote: "Participant voluntarily supplied their phone number during the hospital or health-screening process for feedback and screening follow-up communication.",
        smsConsentRecordedBy: actor.uid,
        smsConsentImportedAt: FieldValue.serverTimestamp(),
        updatedBy: actor.uid,
        updatedAt: FieldValue.serverTimestamp(),
      }));
      await batch.commit();
    }
    await writeAudit(actor.uid, "contact.consent_bulk_migrated", "feedback_contact", "health-screening-consent", { count: String(preview.summary.contactsToMarkConsented), source: "health_screening", scope: SCREENING_CONSENT_SCOPES.join(",") });
    return NextResponse.json({ ok: true, applied: preview.summary.contactsToMarkConsented, ...preview.summary });
  } catch (error) {
    if (error instanceof Error && error.message === "CONTACT_LIMIT") return NextResponse.json({ ok: false, message: "The contact directory exceeds the 5,000-contact safety limit." }, { status: 413 });
    throw error;
  }
}
