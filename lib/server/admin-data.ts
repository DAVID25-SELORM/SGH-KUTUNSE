import "server-only";
import { FieldPath, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { submissionKinds, SUBMISSION_STATUSES, type SubmissionKind } from "@/lib/types/submissions";
import { paginateSubmissionRows } from "@/lib/submission-search";

export type SerializedData = Record<string, unknown> & { reference?: unknown; fullName?: unknown; contactName?: unknown; companyName?: unknown; title?: unknown; name?: unknown; status?: unknown; slug?: unknown; category?: unknown; createdAt?: unknown };
export function serialize(data: FirebaseFirestore.DocumentData): SerializedData {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value && typeof value.toDate === "function" ? value.toDate().toISOString() : value]));
}

export type InboxQuery = { status?: string; search?: string; from?: string; to?: string; cursor?: string };

export async function listSubmissions(kind: SubmissionKind, filters: InboxQuery): Promise<{ rows: Array<{id:string}&Record<string,unknown>>; nextCursor: string | null }> {
  const collection = adminDb.collection(submissionKinds[kind].collection);
  let query: FirebaseFirestore.Query = collection;
  if (filters.status && SUBMISSION_STATUSES.includes(filters.status as never)) query = query.where("status", "==", filters.status);
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) query = query.where("createdAt", ">=", Timestamp.fromDate(new Date(`${filters.from}T00:00:00Z`)));
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) query = query.where("createdAt", "<=", Timestamp.fromDate(new Date(`${filters.to}T23:59:59.999Z`)));
  query = query.orderBy("createdAt", "desc").orderBy(FieldPath.documentId(), "desc");
  const snapshot = await query.get();
  const allRows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const cursor = filters.cursor && /^[\w-]{1,128}$/.test(filters.cursor) ? filters.cursor : undefined;
  const { page, nextCursor } = paginateSubmissionRows(allRows, filters.search?.slice(0, 80), cursor);
  return { rows: page.map(({ id, ...data }) => ({ id, ...serialize(data) } as {id:string}&Record<string,unknown>)), nextCursor };
}

export async function getSubmission(kind: SubmissionKind, id: string): Promise<({ id: string } & Record<string, unknown>) | null> {
  const ref = adminDb.collection(submissionKinds[kind].collection).doc(id);
  const [doc, notes, history] = await Promise.all([ref.get(), ref.collection("internal_notes").orderBy("createdAt", "asc").get(), ref.collection("history").orderBy("createdAt", "asc").get()]);
  return doc.exists ? { id: doc.id, ...serialize(doc.data()!), internalNotes: notes.docs.map((entry) => ({ id: entry.id, ...serialize(entry.data()) })), history: history.docs.map((entry) => ({ id: entry.id, ...serialize(entry.data()) })) } : null;
}
