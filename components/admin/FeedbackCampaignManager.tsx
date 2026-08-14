"use client";

import { useState } from "react";
import { campaignSources, defaultFeedbackMessage } from "@/lib/feedback-campaigns";

type Campaign = {
  code: string; name: string; source: string; message: string; status: string;
  recipientCount: number; queuedCount: number; mockedCount: number; acceptedCount: number;
  deliveredCount: number; failedCount: number; optedOutCount: number; responseCount: number;
};
type Preparation = { added: number; queued: number; duplicateCount: number; invalid: number; optedOut: number };

const labels: Record<string, string> = {
  all_contacts: "All contacts", staff: "Staff", health_screening: "Health screening",
  facility: "Facility", outpatient: "Outpatient", reception: "Reception",
  laboratory: "Laboratory", pharmacy: "Pharmacy", custom_list: "Custom list", other: "Other",
};

async function request(url: string, body?: unknown) {
  const response = await fetch(url, body === undefined ? undefined : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "The request could not be completed.");
  return data;
}

export function FeedbackCampaignManager({ initialCampaigns, canSend, providerMode }: {
  initialCampaigns: Campaign[]; canSend: boolean; providerMode: "mock" | "sandbox" | "live";
}) {
  const [items, setItems] = useState(initialCampaigns);
  const [source, setSource] = useState<(typeof campaignSources)[number]>("health_screening");
  const [customContacts, setCustomContacts] = useState("");
  const [message, setMessage] = useState(defaultFeedbackMessage);
  const [testPhone, setTestPhone] = useState("");
  const [active, setActive] = useState<Campaign | null>(null);
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [tested, setTested] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function run<T>(work: () => Promise<T>, success?: string) {
    setBusy(true); setNotice("");
    try { const result = await work(); if (success) setNotice(success); return result; }
    catch (error) { setNotice(error instanceof Error ? error.message : "Request failed."); return undefined; }
    finally { setBusy(false); }
  }

  async function prepareRecipients() {
    const result = await run(async () => {
      const name = `${labels[source]} feedback - ${new Date().toLocaleDateString("en-GB")}`;
      const created = await request("/api/admin/feedback/campaigns", { name, source, message });
      const campaign: Campaign = { code: created.code, name, source, message, status: "draft", recipientCount: 0, queuedCount: 0, mockedCount: 0, acceptedCount: 0, deliveredCount: 0, failedCount: 0, optedOutCount: 0, responseCount: 0 };
      const prepared = source === "custom_list"
        ? await request(`/api/admin/feedback/campaigns/${created.code}/recipients`, { recipients: customContacts })
        : await request(`/api/admin/feedback/campaigns/${created.code}/recipients/all`, {});
      const summary: Preparation = {
        added: Number(prepared.added ?? 0), queued: Number(prepared.queued ?? prepared.added - prepared.optedOut),
        duplicateCount: Number(prepared.duplicateCount ?? 0), invalid: Number(prepared.invalid ?? prepared.invalidCount ?? 0),
        optedOut: Number(prepared.optedOut ?? 0),
      };
      const ready = { ...campaign, status: "ready", recipientCount: summary.added, queuedCount: summary.queued, optedOutCount: summary.optedOut };
      setActive(ready); setPreparation(summary); setItems((old) => [ready, ...old]); setTested(false);
      return ready;
    }, "Recipients prepared securely. Review the message, then send a test.");
    return result;
  }

  async function sendTest() {
    if (!active) return;
    await run(async () => {
      await request(`/api/admin/feedback/campaigns/${active.code}/send`, { action: "test", testPhone, confirmation: "SEND TEST" });
      setTested(true);
    }, providerMode === "live" ? "Live test SMS accepted by Arkesel. Check the handset and open the survey link." : providerMode === "sandbox" ? "Sandbox test passed. No SMS was delivered to a handset." : "Mock test passed. No real SMS was sent.");
  }

  function reset() { setActive(null); setPreparation(null); setTested(false); setNotice(""); setTestPhone(""); }

  const steps = ["Select recipients", "Review message", "Test", "Send"];
  const currentStep = !active ? 1 : !tested ? 2 : 4;

  return <div className="mt-6 space-y-8">
    <section className="rounded-2xl border bg-white p-5 sm:p-6">
      <ol className="grid gap-2 sm:grid-cols-4" aria-label="Send feedback SMS steps">
        {steps.map((step, index) => <li key={step} className={`rounded-xl px-3 py-3 text-sm font-semibold ${currentStep >= index + 1 ? "bg-purple-deep text-white" : "bg-bg-soft text-text-muted"}`}>{index + 1}. {step}</li>)}
      </ol>

      {!active ? <div className="mt-7">
        <h2 className="text-xl font-semibold">1. Select recipients</h2>
        <p className="mt-1 text-sm text-text-muted">Contacts are automatically normalized, deduplicated and checked against opt-outs.</p>
        <label className="mt-4 block font-semibold">Recipient group
          <select value={source} onChange={(event) => setSource(event.target.value as typeof source)} className="mt-2 w-full rounded-xl border p-3 sm:max-w-xl">
            {campaignSources.filter((item) => item !== "other").map((item) => <option key={item} value={item}>{labels[item]}</option>)}
          </select>
        </label>
        {source === "custom_list" && <label className="mt-4 block font-semibold">Consented Ghana phone numbers
          <textarea value={customContacts} onChange={(event) => setCustomContacts(event.target.value)} rows={5} placeholder="One number per line or separated by commas" className="mt-2 w-full rounded-xl border p-3" />
        </label>}
        <button disabled={busy || (source === "custom_list" && !customContacts.trim())} onClick={prepareRecipients} className="mt-5 min-h-11 rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Preparing contacts…" : "Continue to review message"}</button>
      </div> : <>
        <div className="mt-7 flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-semibold">Recipients ready</h2><p className="text-sm text-text-muted">{labels[active.source] ?? active.source}</p></div>
          <button onClick={reset} className="rounded-xl border px-4 py-2 font-semibold">Change recipients</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[["Ready", active.queuedCount], ["Duplicates removed", preparation?.duplicateCount ?? 0], ["Opted out", preparation?.optedOut ?? 0], ["Invalid", preparation?.invalid ?? 0], ["Total reviewed", (preparation?.added ?? 0) + (preparation?.duplicateCount ?? 0) + (preparation?.invalid ?? 0)]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-bg-soft p-3 text-center"><strong className="block text-xl text-purple-deep">{value}</strong><small>{label}</small></div>)}
        </div>

        <div className="mt-7">
          <h2 className="text-xl font-semibold">2. Review message</h2>
          <label className="mt-3 block font-semibold">Controlled feedback message
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} disabled className="mt-2 w-full rounded-xl border bg-bg-soft p-3" />
          </label>
          <p className="mt-2 text-sm text-text-muted">The secure survey link is inserted automatically. Clinical information cannot be added.</p>
        </div>

        <div className="mt-7">
          <h2 className="text-xl font-semibold">3. Test</h2>
          <p className="mt-1 text-sm text-text-muted">Confirm the message workflow using one authorised Ghana number.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={testPhone} onChange={(event) => setTestPhone(event.target.value)} placeholder="Test phone number" className="min-h-11 rounded-xl border p-3 sm:w-80" /><button disabled={busy || !canSend || !testPhone.trim()} onClick={sendTest} className="min-h-11 rounded-xl border border-purple-deep px-5 py-3 font-semibold text-purple-deep disabled:opacity-50">Send Test SMS</button></div>
          {!canSend && <p className="mt-2 text-sm text-red-700">Your administrator role does not have permission to test or send SMS.</p>}
        </div>

        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-xl font-semibold">4. Send</h2>
          <p className="mt-1 text-sm">{tested ? "The test step passed." : "Complete the live handset test and submit one survey response first."} Live bulk sending remains locked during verification.</p>
          <button disabled className="mt-4 min-h-11 rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white opacity-50">Send SMS to {active.queuedCount} Recipients</button>
        </div>
      </>}
    </section>

    {notice && <p role="status" className="rounded-xl bg-amber-50 p-4">{notice}</p>}

    <section>
      <h2 className="text-xl font-semibold">Previous sends</h2>
      <p className="mt-1 text-sm text-text-muted">Campaign history and delivery results.</p>
      <div className="mt-4 space-y-3">
        {!items.length && <p className="rounded-2xl border bg-white p-5">No previous sends yet.</p>}
        {items.map((campaign) => <article key={campaign.code} className="rounded-2xl border bg-white p-5">
          <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold">{campaign.name}</h3><p className="text-sm text-text-muted">{labels[campaign.source] ?? campaign.source} · {campaign.status.replaceAll("_", " ")}</p></div><span className="text-sm text-text-muted">{campaign.code}</span></div>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[["Total", campaign.recipientCount], ["Queued", campaign.queuedCount], ["Sent", campaign.acceptedCount + campaign.mockedCount + campaign.deliveredCount], ["Delivered", campaign.deliveredCount], ["Failed", campaign.failedCount], ["Opted out", campaign.optedOutCount]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-bg-soft p-2 text-center"><strong className="block">{value}</strong><small>{label}</small></div>)}
          </div>
        </article>)}
      </div>
    </section>
  </div>;
}
