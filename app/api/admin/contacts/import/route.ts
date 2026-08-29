import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { importRequestSchema, validateContactImport } from "@/lib/contact-import";
import { recipientKey } from "@/lib/feedback-campaigns";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";

const safePreview = (rows: ReturnType<typeof validateContactImport>) => rows.slice(0, 100).map(row => ({ rowNumber: row.rowNumber, state: row.state, fullName: row.contact?.fullName ?? "", phone: row.contact?.normalizedPhone ?? "", category: row.contact?.source ?? "", reasons: row.reasons }));
const summary = (rows: ReturnType<typeof validateContactImport>) => ({ total: rows.length, valid: rows.filter(r => r.state === "new" || r.state === "existing").length, invalid: rows.filter(r => r.state === "invalid").length, existing: rows.filter(r => r.state === "existing").length, new: rows.filter(r => r.state === "new").length, duplicates: rows.filter(r => r.state === "duplicate").length });

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 8 * 1024 * 1024) return NextResponse.json({ ok: false, message: "Import payload is too large." }, { status: 413 });
  const actor = await verifyAdminRequest("contacts_manage");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const body = await request.json().catch(() => null) as ({ action?: unknown } & Record<string, unknown>) | null;
  const action = body?.action === "import" ? "import" : "preview";
  const parsed = importRequestSchema.safeParse(body ? Object.fromEntries(Object.entries(body).filter(([key]) => key !== "action")) : null);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Check the import settings and column mapping.", issues: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.consentMode === "batch" && (!actor.roles.includes("super_admin") || !parsed.data.confirmed)) return NextResponse.json({ ok: false, message: "Verified batch consent requires Super Admin confirmation." }, { status: 403 });
  const existingSnapshot = await adminDb.collection("feedback_contacts").select().get();
  const existingIds = new Set(existingSnapshot.docs.map(doc => doc.id));
  const rows = validateContactImport(parsed.data, existingIds, recipientKey);
  const counts = summary(rows);
  if (action === "preview") {
    const previewId = randomUUID();
    await writeAudit(actor.uid, "contacts.import_previewed", "contact_import", previewId, Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, String(value)])));
    return NextResponse.json({ ok: true, previewId, summary: counts, rows: safePreview(rows) });
  }
  const importId = randomUUID(), importRef = adminDb.collection("contact_imports").doc(importId);
  await importRef.create({ filename: parsed.data.filename, uploadedBy: actor.uid, startedAt: FieldValue.serverTimestamp(), category: parsed.data.categoryMode === "all" ? parsed.data.category : "from_file", totalRows: rows.length, status: "running" });
  let imported = 0, skipped = 0, updated = 0, failed = counts.invalid;
  try {
    const actionable = rows.filter(row => row.state === "new" || (row.state === "existing" && parsed.data.existingMode === "update_missing"));
    skipped = rows.length - actionable.length;
    for (let offset = 0; offset < actionable.length; offset += 400) {
      const batch = adminDb.batch();
      for (const row of actionable.slice(offset, offset + 400)) {
        if (!row.contact || !row.id) { failed++; continue; }
        const ref = adminDb.collection("feedback_contacts").doc(row.id);
        if (row.state === "new") { batch.create(ref, { ...row.contact, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), createdBy: actor.uid, updatedBy: actor.uid, ...(row.contact.smsConsentStatus === "opted_in" ? { smsConsentRecordedBy: actor.uid, smsConsentUpdatedAt: FieldValue.serverTimestamp() } : {}) }); imported++; }
        else {
          const current = (await ref.get()).data() ?? {};
          const protectedFields = new Set(["smsOptIn", "smsConsentStatus", "smsConsentSource", "smsConsentScope", "smsConsentDate", "smsConsentEvidenceNote", "smsConsentRecordedBy", "smsConsentUpdatedAt", "doNotContact"]);
          const missing = Object.fromEntries(Object.entries(row.contact).filter(([key, value]) => !protectedFields.has(key) && (current[key] === "" || current[key] == null || (Array.isArray(current[key]) && !(current[key] as unknown[]).length)) && value !== "" && value != null));
          batch.update(ref, { ...missing, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid }); updated++;
        }
      }
      await batch.commit();
    }
    await importRef.update({ status: "completed", completedAt: FieldValue.serverTimestamp(), imported, skipped, updated, failed });
    await writeAudit(actor.uid, "contacts.import_completed", "contact_import", importId, { total: String(rows.length), imported: String(imported), skipped: String(skipped), updated: String(updated), failed: String(failed) });
    return NextResponse.json({ ok: true, importId, summary: { ...counts, imported, skipped, updated, failed }, failures: rows.filter(row => row.state === "invalid").map(row => ({ rowNumber: row.rowNumber, reason: row.reasons.join("; ") })) });
  } catch {
    await importRef.set({ status: "failed", completedAt: FieldValue.serverTimestamp(), imported, skipped, updated, failed: failed + 1 }, { merge: true });
    await writeAudit(actor.uid, "contacts.import_failed", "contact_import", importId, { imported: String(imported), errorClass: "batch_write_failed" });
    return NextResponse.json({ ok: false, importId, message: "Import stopped after a batch failure. Review the result before retrying." }, { status: 500 });
  }
}
