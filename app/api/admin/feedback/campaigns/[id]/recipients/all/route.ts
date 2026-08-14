import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { recipientKey } from "@/lib/feedback-campaigns";
import { normalizeGhanaPhone } from "@/lib/sms";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";

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

  const { id } = await context.params;
  const targetRef = adminDb.collection("feedback_campaigns").doc(id);
  const target = await targetRef.get();
  if (!target.exists)
    return NextResponse.json({ ok: false, message: "Campaign not found." }, { status: 404 });
  const targetSource = String(target.data()?.source ?? "");
  if (targetSource === "custom_list")
    return NextResponse.json({ ok: false, message: "Custom lists must be supplied by the administrator." }, { status: 409 });
  if (!["draft", "ready"].includes(String(target.data()?.status)))
    return NextResponse.json({ ok: false, message: "Recipients cannot be changed after processing starts." }, { status: 409 });

  const sourceCampaigns = targetSource === "all_contacts"
    ? await adminDb.collection("feedback_campaigns").where("source", "!=", "all_contacts").limit(100).get()
    : await adminDb.collection("feedback_campaigns").where("source", "==", targetSource).limit(100).get();
  const sourceSnapshots = await Promise.all(
    sourceCampaigns.docs.filter((campaign) => campaign.id !== id).map((campaign) =>
      campaign.ref.collection("recipients").limit(5_000).get(),
    ),
  );
  const uniquePhones = new Map<string, string>();
  let invalid = 0;
  for (const snapshot of sourceSnapshots) {
    for (const document of snapshot.docs) {
      if (document.data().status === "opted_out") continue;
      const phone = normalizeGhanaPhone(String(document.data().phone ?? ""));
      if (!phone) {
        invalid++;
        continue;
      }
      uniquePhones.set(recipientKey(phone), phone);
    }
  }
  if (!uniquePhones.size)
    return NextResponse.json({ ok: false, message: "No eligible source contacts were found." }, { status: 409 });

  const candidates = [...uniquePhones].map(([hash, phone]) => ({ hash, phone }));
  const existing = new Set<string>();
  const optedOut = new Set<string>();
  for (const group of chunks(candidates)) {
    const [targetDocs, optOutDocs] = await Promise.all([
      adminDb.getAll(...group.map(({ hash }) => targetRef.collection("recipients").doc(hash))),
      adminDb.getAll(...group.map(({ hash }) => adminDb.collection("sms_opt_outs").doc(hash))),
    ]);
    targetDocs.forEach((document, index) => {
      if (document.exists) existing.add(group[index].hash);
    });
    optOutDocs.forEach((document, index) => {
      if (document.exists) optedOut.add(group[index].hash);
    });
  }

  const newCandidates = candidates.filter(({ hash }) => !existing.has(hash));
  const queuedCandidates = newCandidates.filter(({ hash }) => !optedOut.has(hash));
  for (const group of chunks(newCandidates, 450)) {
    const batch = adminDb.batch();
    group.forEach(({ hash, phone }) => {
      batch.create(targetRef.collection("recipients").doc(hash), {
        phone,
        phoneHash: hash,
        status: optedOut.has(hash) ? "opted_out" : "queued",
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
      queuedCount: FieldValue.increment(queuedCandidates.length),
      optedOutCount: FieldValue.increment(optedOut.size),
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
      uniqueContacts: String(uniquePhones.size),
      added: String(newCandidates.length),
      duplicates: String(existing.size),
      optedOut: String(optedOut.size),
      invalid: String(invalid),
    },
  );
  return NextResponse.json({
    ok: true,
    scanned: uniquePhones.size,
    added: newCandidates.length,
    queued: queuedCandidates.length,
    duplicateCount: existing.size,
    optedOut: optedOut.size,
    invalid,
  });
}
