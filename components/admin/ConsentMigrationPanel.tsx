"use client";

import { useState } from "react";

type Preview = { totalContacts: number; contactsToMarkConsented: number; existingOptOuts: number; doNotContact: number; duplicates: number; invalidNumbers: number; inactive: number; alreadyScoped: number; consentSource: string; consentScope: string[] };

export function ConsentMigrationPanel() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function request(action: "preview" | "apply") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/contacts/consent-migration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, confirmation }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Consent migration could not be completed.");
      setPreview(data);
      setMessage(action === "preview" ? "Preview generated. No contacts were changed." : `${data.applied} contacts were updated with purpose-limited consent.`);
      if (action === "apply") setConfirmation("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Consent migration could not be completed."); }
    finally { setBusy(false); }
  }
  const phrase = preview ? `APPLY HEALTH SCREENING CONSENT TO ${preview.contactsToMarkConsented}` : "";
  return <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
    <p className="text-sm font-semibold text-amber-900">SUPER ADMIN CONTROL</p>
    <h2 className="mt-1 text-xl font-semibold text-purple-deep">Purpose-limited screening consent migration</h2>
    <p className="mt-2 text-sm">Records verified consent for feedback requests and health-screening follow-up only. It does not grant advertising or unrestricted promotional consent.</p>
    <button disabled={busy} onClick={() => request("preview")} className="mt-4 rounded-xl border border-purple-deep px-4 py-3 font-semibold text-purple-deep disabled:opacity-50">Preview migration</button>
    {preview && <div className="mt-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Total contacts",preview.totalContacts],["To mark consented",preview.contactsToMarkConsented],["Existing opt-outs",preview.existingOptOuts],["Do not contact",preview.doNotContact],["Duplicates",preview.duplicates],["Invalid numbers",preview.invalidNumbers],["Inactive",preview.inactive],["Already scoped",preview.alreadyScoped]].map(([label,value])=><div key={String(label)} className="rounded-xl bg-white p-3"><strong className="block text-xl text-purple-deep">{value}</strong><span className="text-sm">{label}</span></div>)}</div>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Consent source</dt><dd>Health Screening</dd></div><div><dt className="font-semibold">Permitted purpose</dt><dd>Feedback Request · Health Screening Follow-up</dd></div></dl>
      <label className="mt-5 block text-sm font-semibold">Explicit confirmation<input value={confirmation} onChange={event=>setConfirmation(event.target.value)} placeholder={phrase} className="mt-2 w-full rounded-xl border bg-white p-3" /></label>
      <button disabled={busy || preview.contactsToMarkConsented < 1 || confirmation !== phrase} onClick={() => request("apply")} className="mt-3 rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white disabled:opacity-50">Apply consent to {preview.contactsToMarkConsented} verified contacts</button>
    </div>}
    {message && <p role="status" className="mt-4 rounded-xl bg-white p-3 text-sm">{message}</p>}
  </section>;
}
