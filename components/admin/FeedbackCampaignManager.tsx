"use client";

import { useEffect, useState } from "react";
import { campaignSources, defaultFeedbackMessage } from "@/lib/feedback-campaigns";
import { AGE_GROUPS } from "@/lib/contacts";

type Campaign = {
  code: string; name: string; source: string; message: string; status: string;
  recipientCount: number; queuedCount: number; mockedCount: number; acceptedCount: number;
  deliveredCount: number; failedCount: number; optedOutCount: number; responseCount: number;
  testSmsAccepted?: boolean; testLinkOpened?: boolean; testFeedbackSubmitted?: boolean; testVerified?: boolean;
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
  const [gender,setGender]=useState("all"),[ageGroups,setAgeGroups]=useState<string[]>([]),[facility,setFacility]=useState(""),[group,setGroup]=useState(""),[tags,setTags]=useState(""),[recentDays,setRecentDays]=useState("30");

  async function run<T>(work: () => Promise<T>, success?: string) {
    setBusy(true); setNotice("");
    try { const result = await work(); if (success) setNotice(success); return result; }
    catch (error) { setNotice(error instanceof Error ? error.message : "Request failed."); return undefined; }
    finally { setBusy(false); }
  }

  async function prepareRecipients() {
    const result = await run(async () => {
      const name = `${labels[source]} feedback - ${new Date().toLocaleDateString("en-GB")}`;
      const excludeContactedSince = recentDays === "0" ? "" : new Date(Date.now() - Number(recentDays) * 86400000).toISOString().slice(0, 10);
      const created = await request("/api/admin/feedback/campaigns", { name, source, message, audience: { gender, ageGroups, source, facility, group, tags: tags.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean), smsConsent: true, hasPhone: true, excludeContactedSince } });
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
      setActive((current) => current ? { ...current, status: "test_sent", testSmsAccepted: true } : current);
    }, providerMode === "live" ? "Live test SMS accepted by Arkesel. Check the handset and open the survey link." : providerMode === "sandbox" ? "Sandbox test passed. No SMS was delivered to a handset." : "Mock test passed. No real SMS was sent.");
  }

  useEffect(() => {
    if (!active || !tested || active.testVerified) return;
    const timer = window.setInterval(async () => {
      try {
        const status = await request(`/api/admin/feedback/campaigns/${active.code}/status`);
        setActive((current) => current ? { ...current, ...status } : current);
      } catch { /* Keep polling; transient network failures must not change verification state. */ }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [active, tested]);

  async function sendBulk() {
    if (!active?.testVerified) return;
    if (!window.confirm(`You are about to send this feedback SMS to ${active.queuedCount} eligible contacts. Continue?`)) return;
    await run(async () => {
      const result = await request(`/api/admin/feedback/campaigns/${active.code}/send`, { action: "batch", confirmation: `SEND ${active.queuedCount}` });
      setActive((current) => current ? { ...current, status: String(result.status ?? current.status), failedCount: current.failedCount + Number(result.failed ?? 0), queuedCount: Math.max(0, current.queuedCount - Number(result.processed ?? 0)) } : current);
    }, "Bulk SMS was submitted to Arkesel. Review the campaign results below.");
  }

  function reset() { setActive(null); setPreparation(null); setTested(false); setNotice(""); setTestPhone(""); }

  const steps = ["Audience", "Message", "Test", "Send", "Results"];
  const currentStep = !active ? 1 : !tested ? 2 : !active.testVerified ? 3 : active.status === "completed" ? 5 : 4;

  return <div className="mt-6 space-y-8">
    <section className="rounded-2xl border bg-white p-5 sm:p-6">
      <ol className="grid gap-2 sm:grid-cols-5" aria-label="Send feedback SMS steps">
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
        {source !== "custom_list" && <label className="mt-4 block font-semibold">Exclude recently contacted
          <select value={recentDays} onChange={(event) => setRecentDays(event.target.value)} className="mt-2 w-full rounded-xl border p-3 sm:max-w-xl">
            <option value="0">Do not exclude by date</option>
            <option value="7">Within the last 7 days</option>
            <option value="30">Within the last 30 days</option>
            <option value="90">Within the last 90 days</option>
          </select>
        </label>}
        {source === "custom_list" && <label className="mt-4 block font-semibold">Consented Ghana phone numbers
          <textarea value={customContacts} onChange={(event) => setCustomContacts(event.target.value)} rows={5} placeholder="One number per line or separated by commas" className="mt-2 w-full rounded-xl border p-3" />
        </label>}
        {source !== "custom_list" && <div className="mt-5 grid gap-4 rounded-2xl bg-bg-soft p-4 sm:grid-cols-2"><label className="font-semibold">Gender<select value={gender} onChange={e=>setGender(e.target.value)} className="mt-2 w-full rounded-xl border bg-white p-3"><option value="all">All</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label><label className="font-semibold">Facility or screening event<input value={facility} onChange={e=>setFacility(e.target.value)} placeholder="Kutunse Screening - Aug 2026" className="mt-2 w-full rounded-xl border bg-white p-3"/></label><label className="font-semibold">Group<input value={group} onChange={e=>setGroup(e.target.value)} className="mt-2 w-full rounded-xl border bg-white p-3"/></label><label className="font-semibold">Tags<input value={tags} onChange={e=>setTags(e.target.value)} placeholder="outreach, follow-up" className="mt-2 w-full rounded-xl border bg-white p-3"/></label><fieldset className="sm:col-span-2"><legend className="font-semibold">Age groups</legend><div className="mt-2 flex flex-wrap gap-2">{AGE_GROUPS.map(item=><label key={item} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm"><input type="checkbox" checked={ageGroups.includes(item)} onChange={e=>setAgeGroups(old=>e.target.checked?[...old,item]:old.filter(x=>x!==item))}/>{item.replaceAll("_","–").replace("65–plus","65+").replace("under–18","Under 18")}</label>)}</div></fieldset><p className="text-sm text-text-muted sm:col-span-2">Only active contacts with valid mobile numbers and SMS consent are included. Opt-outs and do-not-contact records are always excluded.</p></div>}
        <button disabled={busy || (source === "custom_list" && !customContacts.trim())} onClick={prepareRecipients} className="mt-5 min-h-11 rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Preparing contacts…" : "Continue to review message"}</button>
      </div> : <>
        <div className="mt-7 flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-semibold">Recipients ready</h2><p className="text-sm text-text-muted">{labels[active.source] ?? active.source}</p></div>
          <button onClick={reset} className="rounded-xl border px-4 py-2 font-semibold">Change recipients</button>
        </div>
        <p className="mt-4 rounded-xl bg-purple-deep p-4 text-lg font-semibold text-white">Selected audience: {active.queuedCount} contacts</p>
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
          <ul className="mt-3 space-y-2 text-sm">
            <li>{active.testSmsAccepted ? "✅" : "○"} Test SMS sent</li>
            <li>{active.testLinkOpened ? "✅" : "○"} Survey link opened</li>
            <li>{active.testFeedbackSubmitted ? "✅" : "○"} Feedback received</li>
            <li>{active.testVerified ? "✅ Test verified — Bulk SMS is ready" : "○ Waiting for successful test feedback submission"}</li>
          </ul>
          <button disabled={busy || !active.testVerified || !canSend || active.queuedCount < 1} onClick={sendBulk} className="mt-4 min-h-11 rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white disabled:opacity-50">Send SMS to {active.queuedCount} Recipients</button>
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
