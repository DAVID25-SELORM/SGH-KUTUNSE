"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { canTransition, type SubmissionStatus } from "@/lib/types/submissions";

type AdminOption = { uid: string; label: string };

export function FeedbackActions({ id, status, assignedTo, administrators }: {
  id: string; status: SubmissionStatus; assignedTo?: string | null; administrators: AdminOption[];
}) {
  const router = useRouter();
  const [assignee, setAssignee] = useState(assignedTo ?? "");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function update(change: Record<string, unknown>, success: string) {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/admin/submissions/feedback/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(change),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) { setMessage(data.message ?? "Changes could not be saved."); return; }
    setMessage(success); setNote(""); router.refresh();
  }

  const action = (label: string, nextStatus: SubmissionStatus, style = "border") =>
    <button type="button" disabled={busy || !canTransition(status, nextStatus)} onClick={() => update({ status: nextStatus }, `${label} successfully.`)} className={`min-h-11 rounded-xl px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${style}`}>{label}</button>;

  return <section className="rounded-2xl border border-border-default bg-white p-5 shadow-sm sm:p-6">
    <h2 className="text-lg font-semibold text-purple-deep">Administrative Actions</h2>
    <p className="mt-1 text-sm text-text-muted">Every change is recorded in the audit trail.</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {action("Mark Reviewed", "in_review", "bg-purple-deep text-white")}
      {action("Mark Contacted", "contacted", "border border-emerald-300 text-emerald-800")}
      {action("Resolve", "completed", "border border-purple-deep text-purple-deep")}
      {action("Archive", "archived", "border border-border-default text-text-body")}
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
      <label className="text-sm font-semibold">Assign to Admin
        <select value={assignee} onChange={(event) => setAssignee(event.target.value)} className="mt-1 w-full rounded-xl border border-border-default bg-white p-3">
          <option value="">Unassigned</option>
          {administrators.map((admin) => <option key={admin.uid} value={admin.uid}>{admin.label}</option>)}
        </select>
      </label>
      <button type="button" disabled={busy || assignee === (assignedTo ?? "")} onClick={() => update({ assignedTo: assignee || null }, "Assignment updated.")} className="min-h-11 self-end rounded-xl border border-purple-deep px-4 py-3 font-semibold text-purple-deep disabled:opacity-40">Save assignment</button>
    </div>
    <label className="mt-5 block text-sm font-semibold">Add Internal Note
      <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={4} placeholder="Visible only to authorized administrators" className="mt-1 w-full rounded-xl border border-border-default p-3" />
    </label>
    <button type="button" disabled={busy || !note.trim()} onClick={() => update({ note }, "Internal note added.")} className="mt-2 min-h-11 rounded-xl bg-purple-deep px-4 py-2 font-semibold text-white disabled:opacity-40">Add note</button>
    {message && <p role="status" className="mt-3 rounded-xl bg-bg-soft p-3 text-sm">{message}</p>}
  </section>;
}
