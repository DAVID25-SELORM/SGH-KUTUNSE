import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/server/auth";
import { getSubmission } from "@/lib/server/admin-data";
import { submissionKinds, type SubmissionKind } from "@/lib/types/submissions";
import { SubmissionActions } from "./SubmissionActions";

export async function SubmissionDetail({ kind, id }: { kind: SubmissionKind; id: string }) {
  const config = submissionKinds[kind];
  const session = await requireAdmin(config.permission);
  const item = await getSubmission(kind, id);
  if (!item) notFound();
  const hidden = new Set(["id", "notes", "memberId", "internalNotes", "history", "searchTerms"]);
  const history = Array.isArray(item.history) ? item.history as Array<Record<string, unknown> & { safeMetadata?: Record<string, unknown> }> : [];
  const notes = Array.isArray(item.internalNotes) ? item.internalNotes as Array<Record<string, unknown>> : [];
  return <section>
    <p className="text-sm font-semibold text-pink-accent">{config.label.toUpperCase()}</p>
    <h1 className="text-3xl font-semibold text-purple-deep">{String(item.reference)}</h1>
    <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm"><dl className="grid gap-4 sm:grid-cols-2">
      {Object.entries(item).filter(([key]) => !hidden.has(key)).map(([key, value]) => <div key={key}><dt className="text-xs font-semibold uppercase text-text-muted">{key.replaceAll(/([A-Z])/g, " $1")}</dt><dd className="mt-1 break-words">{value == null ? "—" : String(value)}</dd></div>)}
      {Boolean(item.memberId) && <div><dt className="text-xs font-semibold uppercase text-text-muted">Member ID</dt><dd>{`••••${String(item.memberId).slice(-4)}`}</dd></div>}
    </dl></div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Action history</h2><ol className="mt-4 border-l-2 border-bg-soft pl-5">{history.map((event) => <li key={String(event.id)} className="relative pb-5 before:absolute before:-left-[1.55rem] before:top-1 before:h-3 before:w-3 before:rounded-full before:bg-purple-deep"><strong className="capitalize">{String(event.action).replaceAll("_", " ")}</strong><p className="text-sm text-text-muted">{String(event.actorDisplayName ?? "System")} · {event.createdAt ? new Date(String(event.createdAt)).toLocaleString() : "Pending"}</p>{event.safeMetadata && <p className="mt-1 text-xs text-text-muted">{Object.entries(event.safeMetadata as Record<string, unknown>).map(([key,value]) => `${key}: ${value ?? "unassigned"}`).join(" · ")}</p>}</li>)}{!history.length && <li className="text-sm text-text-muted">No history entries are available for this legacy request.</li>}</ol></section>
      <section className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Internal notes</h2><div className="mt-4 flex flex-col gap-4">{notes.map((note) => <article key={String(note.id)} className="rounded-xl bg-bg-soft p-4"><p className="whitespace-pre-wrap text-sm">{String(note.text)}</p><p className="mt-2 text-xs text-text-muted">{String(note.authorDisplayName)} · {note.createdAt ? new Date(String(note.createdAt)).toLocaleString() : "Pending"}</p></article>)}{!notes.length && <p className="text-sm text-text-muted">No internal notes.</p>}</div></section>
    </div>
    {session.role !== "viewer" && <SubmissionActions kind={kind} id={id} status={String(item.status)} />}
  </section>;
}
