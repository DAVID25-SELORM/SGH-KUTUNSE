import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { contactMergeSchema, contactSchema, prepareContact } from "@/lib/contacts";
import { recipientKey } from "@/lib/feedback-campaigns";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";
const valid = (id: string) => /^[a-f0-9]{64}$/.test(id);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 }); const actor = await verifyAdminRequest("contacts_manage"); if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await params; if (!valid(id)) return NextResponse.json({ ok: false }, { status: 404 }); const parsed = await parseJson(request, contactSchema); if (parsed.error) return parsed.error;
  const ref = adminDb.collection("feedback_contacts").doc(id); const current = await ref.get(); if (!current.exists) return NextResponse.json({ ok: false }, { status: 404 });
  try { const data = prepareContact(parsed.data); const nextId = recipientKey(data.normalizedPhone); if (nextId !== id) { const nextRef=adminDb.collection("feedback_contacts").doc(nextId); if ((await nextRef.get()).exists) return NextResponse.json({ok:false,message:"That phone number belongs to another contact. Use Merge duplicate instead."},{status:409}); const batch=adminDb.batch(); batch.create(nextRef,{...current.data(),...data,createdAt:current.data()?.createdAt??FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),updatedBy:actor.uid}); batch.update(ref,{status:"archived",mergedInto:nextId,doNotContact:true,updatedAt:FieldValue.serverTimestamp(),updatedBy:actor.uid}); await batch.commit(); await writeAudit(actor.uid,"contact.updated","contact",nextId,{field:"phone"}); return NextResponse.json({ok:true,id:nextId}); }
    const old = current.data()!; const consentChanged = old.smsOptIn !== data.smsOptIn || old.smsConsentStatus !== data.smsConsentStatus || JSON.stringify(old.smsConsentScope ?? []) !== JSON.stringify(data.smsConsentScope) || old.emailOptIn !== data.emailOptIn || old.doNotContact !== data.doNotContact; await ref.update({ ...data, ...(consentChanged ? { smsConsentRecordedBy: actor.uid, smsConsentUpdatedAt: FieldValue.serverTimestamp() } : {}), sources: [...new Set([...(Array.isArray(old.sources) ? old.sources : [old.source]), ...data.sources])], updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
    await writeAudit(actor.uid, consentChanged ? "consent.changed" : data.status === "archived" && old.status !== "archived" ? "contact.archived" : "contact.updated", "contact", id, { source: data.source }); return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Contact could not be saved." }, { status: 400 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 }); const actor = await verifyAdminRequest("contacts_manage"); if (!actor || actor.role !== "super_admin") return NextResponse.json({ ok: false, message: "Only a Super Admin can delete contacts." }, { status: 403 });
  const { id } = await params; if (!valid(id)) return NextResponse.json({ ok: false }, { status: 404 }); const ref = adminDb.collection("feedback_contacts").doc(id); const current = await ref.get(); if (!current.exists) return NextResponse.json({ ok: false }, { status: 404 });
  const campaignUse = await adminDb.collectionGroup("recipients").where("phoneHash", "==", id).limit(1).get(); if (!campaignUse.empty) { await ref.update({ status: "archived", doNotContact: true, fullName: "", email: "", notes: "", updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid }); await writeAudit(actor.uid, "contact.archived", "contact", id, { reason: "historical_reference" }); return NextResponse.json({ ok: true, archived: true }); }
  await ref.delete(); await writeAudit(actor.uid, "contact.deleted", "contact", id); return NextResponse.json({ ok: true, deleted: true });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 }); const actor = await verifyAdminRequest("contacts_manage"); if (!actor) return NextResponse.json({ ok: false }, { status: 403 }); const { id } = await params; if (!valid(id)) return NextResponse.json({ ok: false }, { status: 404 }); const parsed = await parseJson(request, contactMergeSchema); if (parsed.error) return parsed.error;
  const sourceRef = adminDb.collection("feedback_contacts").doc(id), targetRef = adminDb.collection("feedback_contacts").doc(parsed.data.targetId); const [source, target] = await Promise.all([sourceRef.get(), targetRef.get()]); if (!source.exists || !target.exists || id === parsed.data.targetId) return NextResponse.json({ ok: false, message: "Select two different existing contacts." }, { status: 400 });
  const a = source.data()!, b = target.data()!; const merged = { ...a, ...Object.fromEntries(Object.entries(b).filter(([, value]) => value !== "" && value != null)), sources: [...new Set([...(a.sources ?? [a.source]), ...(b.sources ?? [b.source])])], tags: [...new Set([...(a.tags ?? []), ...(b.tags ?? [])])], updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid };
  const batch = adminDb.batch(); batch.set(targetRef, merged, { merge: true }); batch.update(sourceRef, { status: "archived", mergedInto: parsed.data.targetId, doNotContact: true, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid }); await batch.commit(); await writeAudit(actor.uid, "contact.merged", "contact", parsed.data.targetId, { sourceContactId: id }); return NextResponse.json({ ok: true, id: parsed.data.targetId });
}
