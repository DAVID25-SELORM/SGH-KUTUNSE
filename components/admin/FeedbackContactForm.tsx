"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const sources = ["staff", "health_screening", "facility", "outpatient", "reception", "laboratory", "pharmacy", "other"] as const;

export function FeedbackContactForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/feedback/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData)) });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(result.message ?? "Contact could not be saved.");
    setMessage(result.duplicate ? "Existing contact updated." : "Contact added.");
    router.refresh();
  }
  return <form action={submit} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
    <label className="text-sm font-semibold">Name (optional)<input name="name" maxLength={120} className="mt-1 w-full rounded-xl border bg-white px-3 py-2" /></label>
    <label className="text-sm font-semibold">Phone number<input name="phone" required inputMode="tel" placeholder="024 000 0000" className="mt-1 w-full rounded-xl border bg-white px-3 py-2" /></label>
    <label className="text-sm font-semibold">Source<select name="source" defaultValue="staff" className="mt-1 w-full rounded-xl border bg-white px-3 py-2">{sources.map(source => <option key={source} value={source}>{source.replaceAll("_", " ")}</option>)}</select></label>
    <button disabled={busy} className="min-h-11 self-end rounded-xl bg-purple-deep px-5 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Add contact"}</button>
    {message ? <p role="status" className="text-sm md:col-span-4">{message}</p> : null}
  </form>;
}
