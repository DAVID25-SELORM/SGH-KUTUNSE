"use client";

import { useState } from "react";
import { campaignSources, defaultFeedbackMessage } from "@/lib/feedback-campaigns";

type Campaign = {
  code: string;
  name: string;
  source: string;
  message: string;
  status: string;
  recipientCount: number;
  queuedCount: number;
  mockedCount: number;
  deliveredCount: number;
  failedCount: number;
  responseCount: number;
};
type Recipient = { id: string; phone: string; status: string; attemptCount: number };

async function request(url: string, body?: unknown) {
  const response = await fetch(url, body === undefined ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "The request could not be completed.");
  return data;
}

export function FeedbackCampaignManager({ initialCampaigns, canSend, providerMode }: {
  initialCampaigns: Campaign[];
  canSend: boolean;
  providerMode: "mock" | "sandbox" | "live";
}) {
  const [items, setItems] = useState(initialCampaigns);
  const [name, setName] = useState("");
  const [source, setSource] = useState<(typeof campaignSources)[number]>("all_contacts");
  const [message, setMessage] = useState(defaultFeedbackMessage);
  const [values, setValues] = useState<Record<string, string>>({});
  const [recipientLists, setRecipientLists] = useState<Record<string, Recipient[] | undefined>>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>, success: string) {
    setBusy(true);
    setNotice("");
    try { await fn(); setNotice(success); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Request failed."); }
    finally { setBusy(false); }
  }
  function update(code: string, change: Partial<Campaign>) {
    setItems((old) => old.map((item) => item.code === code ? { ...item, ...change } : item));
  }

  return <div className="mt-6 space-y-6">
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="text-xl font-semibold">Create campaign</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="font-semibold">Name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label>
        <label className="font-semibold">Source<select value={source} onChange={(event) => setSource(event.target.value as typeof source)} className="mt-2 w-full rounded-xl border p-3">{campaignSources.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase())}</option>)}</select></label>
        <label className="font-semibold lg:col-span-2">Controlled SMS template<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border p-3" /><small className="block text-text-muted">Keep [SURVEY LINK]. Never add clinical information.</small></label>
      </div>
      <button disabled={busy} onClick={() => run(async () => {
        const data = await request("/api/admin/feedback/campaigns", { name, source, message });
        setItems((old) => [{ code: data.code, name, source, message, status: "draft", recipientCount: 0, queuedCount: 0, mockedCount: 0, deliveredCount: 0, failedCount: 0, responseCount: 0 }, ...old]);
        setName("");
      }, "Draft campaign created.")} className="mt-4 rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white">Create draft</button>
    </section>

    {notice && <p role="status" className="rounded-xl bg-amber-50 p-4">{notice}</p>}
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Campaigns</h2>
      {!items.length && <p className="rounded-2xl border bg-white p-5">No campaigns yet.</p>}
      {items.map((campaign) => <article key={campaign.code} className="rounded-2xl border bg-white p-5">
        <h3 className="text-lg font-semibold">{campaign.name}</h3>
        <p className="text-sm text-text-muted">{campaign.source} · {campaign.status} · {campaign.code}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{[["Recipients", campaign.recipientCount], ["Queued", campaign.queuedCount], ["Mocked", campaign.mockedCount], ["Delivered", campaign.deliveredCount], ["Failed", campaign.failedCount], ["Responses", campaign.responseCount]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-bg-soft p-2 text-center"><strong className="block">{value}</strong><small>{label}</small></div>)}</div>

        <div className="mt-3">
          <button disabled={busy} onClick={() => run(async () => {
            if (recipientLists[campaign.code]) {
              setRecipientLists((old) => ({ ...old, [campaign.code]: undefined }));
              return;
            }
            const data = await request(`/api/admin/feedback/campaigns/${campaign.code}/recipients`);
            setRecipientLists((old) => ({ ...old, [campaign.code]: data.recipients }));
          }, recipientLists[campaign.code] ? "Recipient list closed." : "Recipient list loaded. Phone numbers are masked for privacy.")} className="min-h-11 rounded-xl border px-4 py-2 font-semibold">{recipientLists[campaign.code] ? "Hide recipients" : "View recipients"}</button>
          {recipientLists[campaign.code] && <div className="mt-3 overflow-hidden rounded-xl border">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-bg-soft px-3 py-2 text-xs font-semibold uppercase tracking-wide"><span>Phone</span><span>Status</span><span>Attempts</span></div>
            {recipientLists[campaign.code]!.length ? recipientLists[campaign.code]!.map((recipient) => <div key={recipient.id} className="grid grid-cols-[1fr_auto_auto] gap-3 border-t px-3 py-3 text-sm"><span>{recipient.phone}</span><span className="capitalize">{recipient.status.replaceAll("_", " ")}</span><span>{recipient.attemptCount}</span></div>) : <p className="border-t p-3 text-sm text-text-muted">No recipients have been added to this campaign.</p>}
          </div>}
        </div>

        <p className="mt-2 text-sm">Response rate: {campaign.recipientCount ? Math.round(campaign.responseCount / campaign.recipientCount * 100) : 0}% {campaign.recipientCount < 10 && "(small sample)"}</p>
        <p className="mt-4 rounded-xl bg-bg-soft p-3 text-sm">{campaign.message.replace("[SURVEY LINK]", `/feedback?campaign=${campaign.code}&source=sms`)}</p>

        {["draft", "ready"].includes(campaign.status) && <div className="mt-4">
          {campaign.source === "all_contacts" && <div className="mb-4 rounded-xl bg-bg-soft p-4"><strong>Build the combined contact list</strong><p className="mt-1 text-sm text-text-muted">Collects unique contacts from every source group, then removes duplicates and global opt-outs. Nothing is sent.</p><button disabled={busy} onClick={() => run(async () => {
            const data = await request(`/api/admin/feedback/campaigns/${campaign.code}/recipients/all`, {});
            update(campaign.code, { status: "ready", recipientCount: campaign.recipientCount + data.added, queuedCount: campaign.queuedCount + data.queued });
          }, "All contacts list prepared. Duplicates and opt-outs were excluded; review the final count before sending.")} className="mt-3 rounded-xl bg-purple-deep px-4 py-3 font-semibold text-white">Gather and filter all contacts</button></div>}
          <label className="font-semibold">Consented Ghana phone numbers<textarea value={values[`recipients-${campaign.code}`] || ""} onChange={(event) => setValues({ ...values, [`recipients-${campaign.code}`]: event.target.value })} rows={4} className="mt-2 w-full rounded-xl border p-3" placeholder="One per line or comma separated" /></label>
          <button disabled={busy} onClick={() => run(async () => {
            const data = await request(`/api/admin/feedback/campaigns/${campaign.code}/recipients`, { recipients: values[`recipients-${campaign.code}`] || "" });
            update(campaign.code, { status: "ready", recipientCount: campaign.recipientCount + data.added, queuedCount: campaign.queuedCount + data.added - data.optedOut });
          }, "Recipients imported; duplicates, invalid numbers and opt-outs were skipped.")} className="mt-2 rounded-xl border px-4 py-2 font-semibold">Import and review</button>
        </div>}

        {canSend && campaign.queuedCount > 0 && providerMode !== "live" && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><strong>{providerMode === "sandbox" ? "Arkesel sandbox only" : "Mock batch only"}</strong><p className="text-sm">No SMS will reach a handset. Type SEND {campaign.queuedCount} to simulate the queued batch.</p><div className="mt-2 flex flex-wrap gap-2"><input value={values[`confirm-${campaign.code}`] || ""} onChange={(event) => setValues({ ...values, [`confirm-${campaign.code}`]: event.target.value })} className="rounded-xl border p-2" /><button disabled={busy} onClick={() => run(async () => {
          const data = await request(`/api/admin/feedback/campaigns/${campaign.code}/send`, { action: "batch", confirmation: values[`confirm-${campaign.code}`] || "" });
          update(campaign.code, { status: `${data.mode}_complete`, mockedCount: campaign.mockedCount + data.processed, queuedCount: campaign.queuedCount - data.processed });
        }, "Sandbox batch completed; no real SMS was sent.")} className="rounded-xl bg-purple-deep px-4 py-2 text-white">Run sandbox batch</button></div><div className="mt-2 flex flex-wrap gap-2"><input placeholder="Test Ghana number" value={values[`test-${campaign.code}`] || ""} onChange={(event) => setValues({ ...values, [`test-${campaign.code}`]: event.target.value })} className="rounded-xl border p-2" /><button disabled={busy} onClick={() => run(async () => { await request(`/api/admin/feedback/campaigns/${campaign.code}/send`, { action: "test", testPhone: values[`test-${campaign.code}`], confirmation: "SEND TEST" }); }, "Sandbox test completed; no real SMS was sent.")} className="rounded-xl border px-4 py-2">Sandbox test</button></div></div>}
      </article>)}
    </section>
  </div>;
}
