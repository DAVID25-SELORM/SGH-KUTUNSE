import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { recipientKey } from "@/lib/feedback-campaigns";
import { normalizeGhanaPhone } from "@/lib/sms";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { ensureApprovedStaffContacts, ensureLegacyCampaignContacts } from "@/lib/server/feedback-contacts";
import type { AudienceFilters } from "@/lib/contacts";
import { loadCampaignAudience } from "@/lib/server/campaign-audience";

const CHUNK_SIZE = 400;

function chunks<T>(items: T[], size = CHUNK_SIZE) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isTrustedOrigin(request))
    return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_campaigns");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  await ensureApprovedStaffContacts();
  await ensureLegacyCampaignContacts();

  const { id } = await context.params;
  const targetRef = adminDb.collection("feedback_campaigns").doc(id);
  const target = await targetRef.get();
  if (!target.exists)
    return NextResponse.json({ ok: false, message: "Campaign not found." }, { status: 404 });
  const targetSource = String(target.data()?.source ?? "");
  const audience = (target.data()?.audience ?? { source: targetSource, smsConsent: true, hasPhone: true }) as AudienceFilters;
  if (targetSource === "custom_list")
    return NextResponse.json({ ok: false, message: "Custom lists must be supplied by the administrator." }, { status: 409 });
  if (!["draft", "ready"].includes(String(target.data()?.status)))
    return NextResponse.json({ ok: false, message: "Recipients cannot be changed after processing starts." }, { status: 409 });

  let resolved;
  try { resolved = await loadCampaignAudience(audience); }
  catch (error) { if (error instanceof Error && error.message === "AUDIENCE_LIMIT") return NextResponse.json({ ok: false, message: "This audience exceeds the 5,000-recipient campaign limit. Apply narrower filters." }, { status: 413 }); throw error; }
  const { summary, eligibleContacts } = resolved;
  if (!summary.eligible) return NextResponse.json({ ok: false, message: "No contacts are currently eligible for SMS.", audience: summary }, { status: 409 });
  const candidates = eligibleContacts.map(contact => { const phone = normalizeGhanaPhone(String(contact.normalizedPhone ?? contact.phone ?? ""))!; return { hash: recipientKey(phone), phone }; });
  const existing = new Set<string>();
  for (const group of chunks(candidates)) {
    const targetDocs = await adminDb.getAll(...group.map(({ hash }) => targetRef.collection("recipients").doc(hash)));
    targetDocs.forEach((document, index) => {
      if (document.exists) existing.add(group[index].hash);
    });
  }

  const newCandidates = candidates.filter(({ hash }) => !existing.has(hash));
  for (const group of chunks(newCandidates, 450)) {
    const batch = adminDb.batch();
    group.forEach(({ hash, phone }) => {
      batch.create(targetRef.collection("recipients").doc(hash), {
        phone,
        phoneHash: hash,
        status: "queued",
        attemptCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }
  await targetRef.set(
    {
      status: "ready",
      recipientCount: FieldValue.increment(newCandidates.length),
      queuedCount: FieldValue.increment(newCandidates.length),
      optedOutCount: FieldValue.increment(summary.optedOut),
      audienceCalculation: summary,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  await writeAudit(
    actor.uid,
    "feedback_campaign.contacts_prepared",
    "feedback_campaign",
    id,
    {
      source: targetSource,
      totalContacts: String(summary.totalContacts), filterMatches: String(summary.filterMatches),
      added: String(newCandidates.length),
      duplicates: String(existing.size),
      optedOut: String(summary.optedOut), invalid: String(summary.invalidPhone), noConsent: String(summary.noConsent), doNotContact: String(summary.doNotContact),
    },
  );
  return NextResponse.json({
    ok: true,
    ...summary,
    added: newCandidates.length,
    queued: newCandidates.length,
    existingCampaignRecipients: existing.size,
  });
}
