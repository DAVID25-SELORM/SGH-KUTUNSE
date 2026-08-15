"use client";

import { useState } from "react";
import type { SmsPolicy } from "@/lib/sms-policy";

export function SmsSettingsForm({ initialPolicy, canWrite }: { initialPolicy: SmsPolicy; canWrite: boolean }) {
  const [policy, setPolicy] = useState(initialPolicy);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function save() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/settings/sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(policy) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "SMS settings could not be saved.");
      setPolicy(data.policy);
      setNotice("SMS sending policy saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "SMS settings could not be saved.");
    } finally { setBusy(false); }
  }

  return <div className="mt-6 max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
    <fieldset disabled={!canWrite || busy}>
      <legend className="text-xl font-semibold text-purple-deep">SMS Sending Hours</legend>
      <p className="mt-2 text-sm text-text-muted">Sending-hours restriction</p>
      <div className="mt-3 flex gap-3">
        {[false, true].map(enabled => <label key={String(enabled)} className="rounded-xl border px-4 py-3 font-semibold"><input type="radio" className="mr-2" checked={policy.sendingRestrictionEnabled === enabled} onChange={() => setPolicy(old => ({ ...old, sendingRestrictionEnabled: enabled }))}/>{enabled ? "On" : "Off"}</label>)}
      </div>
      {!policy.sendingRestrictionEnabled ? <p className="mt-4 rounded-xl bg-bg-soft p-4">SMS campaigns may be sent or scheduled at any valid time.</p> : <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="font-semibold">Start time<input aria-label="Start time" type="time" required value={policy.sendingStartTime} onChange={event => setPolicy(old => ({ ...old, sendingStartTime: event.target.value }))} className="mt-2 w-full rounded-xl border p-3"/></label>
        <label className="font-semibold">End time<input aria-label="End time" type="time" required value={policy.sendingEndTime} onChange={event => setPolicy(old => ({ ...old, sendingEndTime: event.target.value }))} className="mt-2 w-full rounded-xl border p-3"/></label>
        <label className="font-semibold sm:col-span-2">Timezone<input value="Ghana time / GMT (Africa/Accra)" disabled className="mt-2 w-full rounded-xl border bg-bg-soft p-3"/></label>
        <p className="text-sm text-text-muted sm:col-span-2">Overnight windows are supported. The end time is exclusive.</p>
      </div>}
    </fieldset>
    {!canWrite && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm">You can view this policy. Only Super Administrators can change it.</p>}
    {canWrite && <button onClick={save} disabled={busy} className="mt-6 min-h-11 rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save SMS settings"}</button>}
    {notice && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-4">{notice}</p>}
  </div>;
}
