import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";
import { hasPermission } from "@/lib/types/admin";
import { writeAudit } from "@/lib/server/audit";
import { SubmissionActions } from "@/components/admin/SubmissionActions";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin("feedback");
  const { id } = await params;
  if (!/^[\w-]{1,128}$/.test(id)) notFound();
  const doc = await adminDb.collection("feedback_responses").doc(id).get();
  if (!doc.exists) notFound();
  const data = doc.data()!;
  const [notes, history] = await Promise.all([
    doc.ref.collection("internal_notes").orderBy("createdAt", "desc").limit(20).get(),
    doc.ref.collection("history").orderBy("createdAt", "desc").limit(30).get(),
  ]);
  const canReceipt = hasPermission(session.role, "feedback_receipts");
  if (data.receiptRestricted && canReceipt)
    await writeAudit(session.uid, "feedback.receipt_viewed", "feedback", id);
  const hidden = new Set([
    "searchTerms",
    "receiptDetails",
    "contactPhone",
    "contactEmail",
  ]);
  return (
    <section>
      <p className="text-sm font-semibold text-pink-accent">
        FEEDBACK RESPONSE
      </p>
      <h1 className="text-3xl font-semibold text-purple-deep">
        {String(data.reference)}
      </h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="font-semibold">Experience summary</h2>
          <dl className="mt-4 grid gap-4">
            {Object.entries(data)
              .filter(([k, v]) => !hidden.has(k) && typeof v !== "object")
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase text-text-muted">
                    {k.replaceAll(/([A-Z])/g, " $1")}
                  </dt>
                  <dd>{String(v ?? "—")}</dd>
                </div>
              ))}
          </dl>
        </div>
        <div className="space-y-6">
          {data.receiptRestricted ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="font-semibold">
                Financial/receipt concern — review required
              </h2>
              {canReceipt ? (
                <p className="mt-3 whitespace-pre-wrap text-sm">
                  {JSON.stringify(data.receiptDetails, null, 2)}
                </p>
              ) : (
                <p className="mt-3 text-sm">
                  Details are restricted to specifically authorized management.
                </p>
              )}
            </div>
          ) : null}
          {data.contactRequested ? (
            <div className="rounded-2xl border bg-white p-6">
              <h2 className="font-semibold">Follow-up requested</h2>
              <p className="mt-3 text-sm">
                {String(data.contactName ?? "Name not provided")}
                {hasPermission(session.role, "feedback_manage")
                  ? ` · ${data.contactPhone ?? data.contactEmail ?? "No contact detail"}`
                  : ""}
              </p>
            </div>
          ) : null}
        </div>
      </div>
      {hasPermission(session.role, "feedback_manage") ? (
        <SubmissionActions kind="feedback" id={id} status={String(data.status)} />
      ) : null}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="font-semibold">Internal follow-up notes</h2>
          <div className="mt-4 space-y-3">
            {notes.docs.map((note) => <div key={note.id} className="rounded-xl bg-bg-soft p-3 text-sm">{String(note.data().text)}</div>)}
            {!notes.size ? <p className="text-sm text-text-muted">No internal notes.</p> : null}
          </div>
        </section>
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="font-semibold">Action history</h2>
          <ol className="mt-4 space-y-3 text-sm">
            {history.docs.map((event) => <li key={event.id}><strong className="capitalize">{String(event.data().action).replaceAll("_", " ")}</strong><span className="text-text-muted"> · {String(event.data().actorDisplayName ?? "System")}</span></li>)}
          </ol>
        </section>
      </div>
    </section>
  );
}
