import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdminRequest } from "@/lib/server/auth";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { parseJson } from "@/lib/server/request";
import { writeAudit } from "@/lib/server/audit";
import { canMutate } from "@/lib/types/admin";
import { canTransition, PRIORITIES, submissionKinds, SUBMISSION_STATUSES, type SubmissionKind, type SubmissionStatus } from "@/lib/types/submissions";
import { isTrustedOrigin } from "@/lib/server/origin";

const schema = z.strictObject({ status: z.enum(SUBMISSION_STATUSES).optional(), priority: z.enum(PRIORITIES).optional(), assignedTo: z.string().trim().max(128).nullable().optional(), note: z.string().trim().min(1).max(2000).optional() });
const actionForStatus = (status: string, kind: string) => status === "contacted" ? "contacted" : status === "completed" ? "completed" : status === "archived" ? "archived" : status === "in_review" && kind === "feedback" ? "reviewed" : "status_changed";

export async function PATCH(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (!(kind in submissionKinds) || !/^[\w-]{1,128}$/.test(id)) return NextResponse.json({ ok: false }, { status: 404 });
  const config = submissionKinds[kind as SubmissionKind];
  const actor = await verifyAdminRequest(config.permission);
  if (!actor || !canMutate(actor.roles)) return NextResponse.json({ ok: false }, { status: 403 });
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, schema); if (parsed.error) return parsed.error;
  const { note, ...requested } = parsed.data;
  const ref = adminDb.collection(config.collection).doc(id);
  const snapshot = await ref.get(); if (!snapshot.exists) return NextResponse.json({ ok: false }, { status: 404 });
  const current = snapshot.data()!;
  if(requested.status&&!canTransition(current.status as SubmissionStatus,requested.status))return NextResponse.json({ok:false,message:"That status transition is not allowed."},{status:409});
  if(requested.assignedTo){try{const assignee=await adminAuth.getUser(requested.assignedTo);if(assignee.disabled||(!assignee.customClaims?.role&&!assignee.customClaims?.roles))return NextResponse.json({ok:false,message:"Assignment requires an active administrator."},{status:400})}catch{return NextResponse.json({ok:false,message:"Assigned administrator was not found."},{status:400})}}
  const changes = Object.fromEntries(Object.entries(requested).filter(([, value]) => value !== undefined));
  const actorDisplayName = actor.name ?? actor.email ?? "Administrator";
  const events: Array<{ action: string; safeMetadata: Record<string, string | null> }> = [];
  if (requested.assignedTo !== undefined && requested.assignedTo !== current.assignedTo) events.push({ action: current.assignedTo ? "reassigned" : "assigned", safeMetadata: { from: current.assignedTo ?? null, to: requested.assignedTo ?? null } });
  if (requested.status && requested.status !== current.status) events.push({ action: actionForStatus(requested.status, kind), safeMetadata: { from: current.status, to: requested.status } });
  if (note) events.push({ action: "internal_note_added", safeMetadata: {} });
  await adminDb.runTransaction(async (transaction) => {
    transaction.update(ref, { ...changes, updatedAt: FieldValue.serverTimestamp(), lastActionAt: FieldValue.serverTimestamp() });
    if (note) transaction.create(ref.collection("internal_notes").doc(), { authorUid: actor.uid, authorDisplayName: actorDisplayName, text: note, createdAt: FieldValue.serverTimestamp() });
    for (const event of events) transaction.create(ref.collection("history").doc(), { ...event, actorUid: actor.uid, actorDisplayName, createdAt: FieldValue.serverTimestamp() });
  });
  for (const event of events) await writeAudit(actor.uid, `submission.${event.action}`, kind, id, { reference: String(current.reference ?? "") });
  return NextResponse.json({ ok: true });
}
