"use client";

import { useCallback, useEffect, useState } from "react";
import { campaignSources, defaultFeedbackMessage } from "@/lib/feedback-campaigns";
import { AGE_GROUPS } from "@/lib/contacts";
import Link from "next/link";
import { isDateWithinSmsPolicy, isTimeWithinSmsPolicy, smsPolicyLabel, type SmsPolicy } from "@/lib/sms-policy";
import { mergeCampaignVerificationStatus } from "@/lib/feedback-verification-state";

type Campaign = {
  code: string; name: string; source: string; message: string; status: string;
  recipientCount: number; queuedCount: number; mockedCount: number; acceptedCount: number;
  deliveredCount: number; failedCount: number; unknownCount: number; optedOutCount: number; responseCount: number;
  testSmsAccepted?: boolean; testLinkOpened?: boolean; testFeedbackSubmitted?: boolean; testVerified?: boolean;
  audience?: Record<string, unknown>;
  scheduledAt?: string; scheduledTimezone?: string; scheduledByName?: string; originalEligibleCount?: number;
};
type AudienceSummary = { totalContacts: number; filterMatches: number; active: number; validMobile: number; smsConsent: number; eligible: number; noConsent: number; invalidPhone: number; optedOut: number; doNotContact: number; duplicates: number; otherExclusions: number };
type Preparation = AudienceSummary & { added: number; queued: number; existingCampaignRecipients: number };

const labels: Record<string, string> = {
  all_contacts: "All contacts", staff: "Staff", health_screening: "Health screening",
  facility: "Facility", outpatient: "Outpatient", reception: "Reception",
  laboratory: "Laboratory", pharmacy: "Pharmacy", custom_list: "Custom list", other: "Other",
};

async function request(url: string, body?: unknown, method: "POST" | "PATCH" = "POST") {
  const response = await fetch(url, body === undefined ? { cache: "no-store" } : {
    method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "The request could not be completed.");
  return data;
}

function AudienceCalculation({ summary, loading }: { summary: AudienceSummary | null; loading: boolean }) {
  if (loading) return <p className="mt-5 rounded-xl bg-bg-soft p-4">Calculating the complete audience...</p>;
  if (!summary) return <p className="mt-5 rounded-xl bg-amber-50 p-4">Audience calculation is temporarily unavailable.</p>;
  return <section className="mt-5 rounded-2xl border bg-white p-4"><h3 className="font-semibold text-purple-deep">Audience calculation</h3><p className="mt-2 font-semibold">{summary.filterMatches} of {summary.totalContacts} contacts match your filters</p><p className="text-lg font-semibold text-emerald-800">{summary.eligible} are eligible for SMS</p><div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">{[["Active", summary.active], ["Valid mobile", summary.validMobile], ["SMS consent", summary.smsConsent], ["No consent", summary.noConsent], ["Invalid / missing phone", summary.invalidPhone], ["Opted out", summary.optedOut], ["Do not contact", summary.doNotContact], ["Duplicates", summary.duplicates], ["Other exclusions", summary.otherExclusions]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-bg-soft p-3"><strong className="block text-lg">{value}</strong>{label}</div>)}</div>{summary.eligible === 0 && <p className="mt-4 rounded-xl bg-amber-50 p-3 font-semibold">No eligible recipients. {summary.noConsent ? `${summary.noConsent} matching contacts have no recorded SMS consent.` : "Review the exclusion counts above."}</p>}</section>;
}

export function FeedbackCampaignManager({ initialCampaigns, canSend, providerMode, schedulingEnabled, initialSmsPolicy }: {
  initialCampaigns: Campaign[]; canSend: boolean; providerMode: "mock" | "sandbox" | "live"; schedulingEnabled: boolean; initialSmsPolicy: SmsPolicy;
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
  const [audienceSummary, setAudienceSummary] = useState<AudienceSummary | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<"now" | "schedule">("now");
  const [scheduleDate, setScheduleDate] = useState(""), [scheduleTime, setScheduleTime] = useState("");
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [smsPolicy, setSmsPolicy] = useState(initialSmsPolicy);
  const [gender,setGender]=useState("all"),[ageGroups,setAgeGroups]=useState<string[]>([]),[facility,setFacility]=useState(""),[group,setGroup]=useState(""),[tags,setTags]=useState(""),[recentDays,setRecentDays]=useState("30");

  useEffect(() => {
    fetch("/api/admin/settings/sms").then(response => response.ok ? response.json() : null).then(data => { if (data?.policy) setSmsPolicy(data.policy); }).catch(() => { /* Server validation remains authoritative if refresh fails. */ });
  }, []);

  async function run<T>(work: () => Promise<T>, success?: string) {
    setBusy(true); setNotice("");
    try { const result = await work(); if (success) setNotice(success); return result; }
    catch (error) { setNotice(error instanceof Error ? error.message : "Request failed."); return undefined; }
    finally { setBusy(false); }
  }

  const audienceFilters = useCallback((selectedSource = source) => { const excludeContactedSince = recentDays === "0" ? "" : new Date(Date.now() - Number(recentDays) * 86400000).toISOString().slice(0, 10); return { gender, ageGroups, source: selectedSource, facility, group, tags: tags.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean), purpose: "feedback_request" as const, smsConsent: true, hasPhone: true, excludeContactedSince }; }, [source, gender, ageGroups, facility, group, tags, recentDays]);

  useEffect(() => {
    if (source === "custom_list") return;
    let cancelled = false;
    const timer = window.setTimeout(async () => { if (!cancelled) setAudienceLoading(true); try { const summary = await request("/api/admin/feedback/audience", audienceFilters()); if (!cancelled) setAudienceSummary(summary); } catch { if (!cancelled) setAudienceSummary(null); } finally { if (!cancelled) setAudienceLoading(false); } }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [source, audienceFilters]);

  async function prepareRecipients() {
    const result = await run(async () => {
      const name = `${labels[source]} feedback - ${new Date().toLocaleDateString("en-GB")}`;
      const created = await request("/api/admin/feedback/campaigns", { name, source, message, audience: audienceFilters() });
      const campaign: Campaign = { code: created.code, name, source, message, status: "draft", recipientCount: 0, queuedCount: 0, mockedCount: 0, acceptedCount: 0, deliveredCount: 0, failedCount: 0, unknownCount: 0, optedOutCount: 0, responseCount: 0 };
      const prepared = source === "custom_list"
        ? await request(`/api/admin/feedback/campaigns/${created.code}/recipients`, { recipients: customContacts })
        : await request(`/api/admin/feedback/campaigns/${created.code}/recipients/all`, {});
      const summary: Preparation = { ...prepared, added: Number(prepared.added ?? 0), queued: Number(prepared.queued ?? 0), existingCampaignRecipients: Number(prepared.existingCampaignRecipients ?? 0) };
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

  async function saveMessage() {
    if (!active) return;
    await run(async () => {
      const result = await request(`/api/admin/feedback/campaigns/${active.code}`, { message }, "PATCH");
      const savedMessage = String(result.message);
      setMessage(savedMessage);
      setActive((current) => current ? { ...current, message: savedMessage } : current);
      setItems((old) => old.map((item) => item.code === active.code ? { ...item, message: savedMessage } : item));
    }, "Message saved. Send the test SMS to verify this exact message.");
  }

  useEffect(() => {
    if (!active || !tested || (active.testVerified && active.status !== "sending")) return;
    const timer = window.setInterval(async () => {
      try {
        const status = await request(`/api/admin/feedback/campaigns/${active.code}/status`);
        setActive((current) => current ? mergeCampaignVerificationStatus(current, status) : current);
      } catch { /* Keep polling; transient network failures must not change verification state. */ }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [active, tested]);

  async function sendBulk() {
    if (!active?.testVerified) return;
    await run(async () => {
      const preview = await request(`/api/admin/feedback/campaigns/${active.code}/send`, { action: "preview", confirmation: "" });
      const finalCount = Number(preview.eligibleCount ?? 0);
      setActive((current) => current ? { ...current, queuedCount: finalCount } : current);
      if (!finalCount) throw new Error("No eligible recipients remain after the final safety check.");
      if (!window.confirm(`You are about to send this feedback SMS to ${finalCount} eligible contacts. Continue?`)) return;
      const result = await request(`/api/admin/feedback/campaigns/${active.code}/send`, { action: "batch", confirmation: `SEND ${finalCount}` });
      setActive((current) => current ? { ...current, status: String(result.status ?? current.status), failedCount: current.failedCount + Number(result.failed ?? 0), queuedCount: Math.max(0, current.queuedCount - Number(result.processed ?? 0)) } : current);
      setNotice(result.status === "partially_failed" ? `Bulk sending completed with ${result.failed} failed or uncertain deliveries. Review the results before follow-up.` : result.status === "failed" ? "Bulk sending failed. No recipient has been marked delivered." : "Bulk SMS was accepted by Arkesel. Delivery is shown separately when confirmed by the provider.");
    });
  }

  async function scheduleCampaign(action: "schedule" | "reschedule" = "schedule") {
    if (!isTimeWithinSmsPolicy(scheduleTime, smsPolicy)) { setNotice(`Choose a time within the hospital SMS sending window: ${smsPolicyLabel(smsPolicy)}.`); return; }
    if (!active?.testVerified || !window.confirm(`${action === "reschedule" ? "Reschedule" : "Schedule"} this campaign for ${scheduleDate} at ${scheduleTime} Africa/Accra?`)) return;
    await run(async () => {
      const result = await request(`/api/admin/feedback/campaigns/${active.code}/schedule`, { action, date: scheduleDate, time: scheduleTime, timezone: "Africa/Accra" });
      const scheduled = { status: "scheduled", scheduledAt: String(result.scheduledAt), scheduledTimezone: "Africa/Accra", originalEligibleCount: Number(result.eligibleCount) };
      setActive(current => current ? { ...current, ...scheduled } : current);
      setItems(old => old.map(item => item.code === active.code ? { ...item, ...scheduled } : item));
      setEditingSchedule(false);
      setNotice(`Campaign scheduled for ${result.scheduledLabel}. Eligibility will be checked again immediately before sending.`);
    });
  }

  async function cancelSchedule() {
    if (!active || !window.confirm("Cancel this scheduled SMS campaign? No messages will be sent by this schedule.")) return;
    await run(async () => {
      await request(`/api/admin/feedback/campaigns/${active.code}/schedule`, { action: "cancel", date: "", time: "", timezone: "Africa/Accra" });
      setActive(current => current ? { ...current, status: "cancelled", scheduledAt: undefined } : current);
      setItems(old => old.map(item => item.code === active.code ? { ...item, status: "cancelled", scheduledAt: undefined } : item));
    }, "Scheduled send cancelled.");
  }

  async function resumeCampaign(campaign: Campaign) {
    setActive(campaign); setMessage(campaign.message); setTested(Boolean(campaign.testSmsAccepted)); setPreparation(null); setNotice(""); setDeliveryOption(campaign.status === "scheduled" ? "schedule" : "now"); setEditingSchedule(false);
    if (campaign.source !== "custom_list") await run(async () => { const summary = await request("/api/admin/feedback/audience", campaign.audience ?? { source: campaign.source, gender: "all", ageGroups: [], facility: "", group: "", tags: [], purpose: "feedback_request", smsConsent: true, hasPhone: true, excludeContactedSince: "" }); setActive(current => current ? { ...current, queuedCount: Number(summary.eligible) } : current); setPreparation({ ...summary, added: Number(summary.eligible), queued: Number(summary.eligible), existingCampaignRecipients: 0 }); });
  }

  async function reconcile(campaign: Campaign) {
    await run(async () => {
      const result = await request(`/api/admin/feedback/campaigns/${campaign.code}/reconcile`, {});
      const refreshed = await request(`/api/admin/feedback/campaigns/${campaign.code}/status`);
      setItems((old) => old.map((item) => item.code === campaign.code ? { ...item, ...refreshed } : item));
      setActive((current) => current?.code === campaign.code ? { ...current, ...refreshed } : current);
      setNotice(`Delivery status checked: ${result.updated} recipient status${result.updated === 1 ? "" : "es"} updated.`);
    });
  }

  function reset() { setActive(null); setMessage(defaultFeedbackMessage); setPreparation(null); setTested(false); setNotice(""); setTestPhone(""); setDeliveryOption("now"); setScheduleDate(""); setScheduleTime(""); setEditingSchedule(false); }

  const steps = ["Audience", "Message", "Test", "Send", "Results"];
  const currentStep = !active ? 1 : !tested ? 2 : !active.testVerified ? 3 : active.status === "completed" ? 5 : 4;
  const canEditMessage = Boolean(active && ["draft", "ready"].includes(active.status) && !active.testSmsAccepted && !active.testVerified);
  const hasUnsavedMessage = Boolean(active && message !== active.message);

  return <div className="mt-6 space-y-8">
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5 shadow-sm"><div><p className="text-sm font-semibold text-text-muted">SMS Sending Policy</p><strong className="text-lg text-purple-deep">{smsPolicyLabel(smsPolicy)}</strong></div><Link href="/admin/settings/sms" className="font-semibold text-purple-deep">Manage SMS Settings</Link></section>
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
        {source !== "custom_list" && <AudienceCalculation summary={audienceSummary} loading={audienceLoading} />}
        <button disabled={busy || audienceLoading || (source === "custom_list" ? !customContacts.trim() : !audienceSummary?.eligible)} onClick={prepareRecipients} className="mt-5 min-h-11 rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Preparing contacts…" : "Continue to review message"}</button>
      </div> : <>
        <div className="mt-7 flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-semibold">Recipients ready</h2><p className="text-sm text-text-muted">{labels[active.source] ?? active.source}</p></div>
          <button onClick={reset} className="rounded-xl border px-4 py-2 font-semibold">Change recipients</button>
        </div>
        <p className="mt-4 rounded-xl bg-purple-deep p-4 text-lg font-semibold text-white">Selected audience: {active.queuedCount} contacts</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[["SMS eligible", active.queuedCount], ["No consent", preparation?.noConsent ?? 0], ["Opted out", preparation?.optedOut ?? 0], ["Invalid", preparation?.invalidPhone ?? 0], ["Do not contact", preparation?.doNotContact ?? 0]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-bg-soft p-3 text-center"><strong className="block text-xl text-purple-deep">{value}</strong><small>{label}</small></div>)}
        </div>

        <div className="mt-7">
          <h2 className="text-xl font-semibold">2. Review message</h2>
          <label className="mt-3 block font-semibold">Controlled feedback message
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} disabled={!canEditMessage || busy} className="mt-2 w-full rounded-xl border bg-bg-soft p-3 disabled:opacity-70" />
          </label>
          <p className="mt-2 text-sm text-text-muted">You can edit and save the message until the test SMS is sent. The secure survey link placeholder must remain, and clinical information cannot be added. After testing, the message is locked so the tested text is exactly what will be sent.</p>
          {canEditMessage && <button disabled={busy || !hasUnsavedMessage} onClick={saveMessage} className="mt-3 min-h-11 rounded-xl border border-purple-deep px-5 py-3 font-semibold text-purple-deep disabled:opacity-50">Save message</button>}
          {hasUnsavedMessage && <p className="mt-2 text-sm font-semibold text-amber-800">Save your message changes before sending the test SMS.</p>}
        </div>

        <div className="mt-7">
          <h2 className="text-xl font-semibold">3. Test</h2>
          <p className="mt-1 text-sm text-text-muted">Confirm the message workflow using one authorised Ghana number.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={testPhone} onChange={(event) => setTestPhone(event.target.value)} placeholder="Test phone number" className="min-h-11 rounded-xl border p-3 sm:w-80" /><button disabled={busy || !canSend || !testPhone.trim() || active.testSmsAccepted || hasUnsavedMessage} onClick={sendTest} className="min-h-11 rounded-xl border border-purple-deep px-5 py-3 font-semibold text-purple-deep disabled:opacity-50">{active.testVerified ? "Test Verified" : active.testSmsAccepted ? "Test SMS Sent" : "Send Test SMS"}</button></div>
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
          <p className={`mt-4 font-semibold ${active.testVerified ? "text-emerald-800" : "text-amber-800"}`}>{active.testVerified ? "Ready to Send" : "Bulk sending is locked until the test is verified."}</p>
          {active.testVerified && active.status !== "scheduled" && <fieldset className="mt-4"><legend className="font-semibold">Delivery time</legend><div className="mt-2 flex flex-wrap gap-3"><label className="rounded-xl border bg-white px-4 py-3"><input className="mr-2" type="radio" checked={deliveryOption === "now"} onChange={() => setDeliveryOption("now")}/>Send now</label><label className="rounded-xl border bg-white px-4 py-3"><input className="mr-2" type="radio" checked={deliveryOption === "schedule"} onChange={() => setDeliveryOption("schedule")} disabled={!schedulingEnabled}/>Schedule later</label></div>{!schedulingEnabled && <p className="mt-2 text-sm text-amber-800">Scheduling becomes available after the secure Cloud Tasks queue and service identity are configured.</p>}</fieldset>}
          {deliveryOption === "schedule" && (active.status !== "scheduled" || editingSchedule) && <div className="mt-4"><p className="mb-3 rounded-xl bg-white p-3 text-sm"><strong>Hospital SMS sending window</strong><br/>{smsPolicyLabel(smsPolicy)}</p><div className="grid gap-3 sm:grid-cols-2"><label className="font-semibold">Date<input type="date" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} className="mt-2 w-full rounded-xl border bg-white p-3"/></label><label className="font-semibold">Time (Ghana time / GMT)<input type="time" value={scheduleTime} onChange={e=>setScheduleTime(e.target.value)} className="mt-2 w-full rounded-xl border bg-white p-3"/></label></div></div>}
          {active.status === "scheduled" && !editingSchedule ? <div className="mt-4 rounded-xl border border-purple-deep bg-white p-4"><strong>Scheduled</strong><p>{active.scheduledAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Accra" }).format(new Date(active.scheduledAt)) : "Time unavailable"} (Ghana time / GMT)</p>{active.scheduledAt && !isDateWithinSmsPolicy(new Date(active.scheduledAt), smsPolicy) && <p className="mt-2 rounded-lg bg-amber-50 p-3 font-semibold text-amber-900">This campaign is scheduled outside the hospital’s current SMS sending hours and will not execute unless rescheduled or the policy changes.</p>}{active.scheduledByName && <p className="text-sm">Scheduled by: {active.scheduledByName}</p>}<p className="text-sm text-text-muted">The final eligible audience and current SMS policy will be checked again before delivery.</p><div className="mt-3 flex gap-2"><button onClick={()=>{setDeliveryOption("schedule"); setEditingSchedule(true);}} className="rounded-xl border px-4 py-2 font-semibold">Reschedule</button><button onClick={cancelSchedule} className="rounded-xl border border-red-700 px-4 py-2 font-semibold text-red-700">Cancel scheduled send</button></div></div> : deliveryOption === "schedule" ? <button disabled={busy || !active.testVerified || !canSend || !scheduleDate || !scheduleTime || !schedulingEnabled || !isTimeWithinSmsPolicy(scheduleTime, smsPolicy)} onClick={()=>scheduleCampaign(active.scheduledAt ? "reschedule" : "schedule")} className="mt-3 min-h-12 rounded-xl bg-purple-deep px-6 py-3 font-semibold text-white disabled:opacity-50">{active.scheduledAt ? "Save new schedule" : `Schedule SMS to ${active.queuedCount} Recipients`}</button> : <button disabled={busy || !active.testVerified || !canSend || active.queuedCount < 1} onClick={sendBulk} className="mt-3 min-h-12 rounded-xl bg-pink-accent px-6 py-3 font-semibold text-white shadow-sm disabled:opacity-50">Final action: Send SMS to {active.queuedCount} Recipients</button>}
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
          <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold">{campaign.name}</h3><p className="text-sm text-text-muted">{labels[campaign.source] ?? campaign.source} · {campaign.status.replaceAll("_", " ")}</p>{campaign.scheduledAt && <p className="mt-1 text-sm font-semibold text-purple-deep">Scheduled: {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" }).format(new Date(campaign.scheduledAt))}</p>}</div><div className="flex items-center gap-2"><span className="text-sm text-text-muted">{campaign.code}</span>{["ready","test_sent","test_link_opened","test_verified","scheduled","sending"].includes(campaign.status) && <button onClick={()=>resumeCampaign(campaign)} className="rounded-lg border px-3 py-2 text-sm font-semibold">Continue</button>}</div></div>
          {providerMode === "live" && campaign.acceptedCount + campaign.failedCount + campaign.unknownCount > 0 && <button disabled={busy || !canSend} onClick={() => reconcile(campaign)} className="mt-3 rounded-lg border border-purple-deep px-3 py-2 text-sm font-semibold text-purple-deep disabled:opacity-50">Check delivery status</button>}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[["Provider accepted", campaign.acceptedCount], ["Delivered", campaign.deliveredCount], ["Failed", campaign.failedCount], ["Unknown", campaign.unknownCount], ["Delivery rate", `${campaign.acceptedCount + campaign.deliveredCount + campaign.failedCount ? Math.round(campaign.deliveredCount * 100 / (campaign.acceptedCount + campaign.deliveredCount + campaign.failedCount)) : 0}%`]].map(([label, value]) => <div key={String(label)} title={label === "Provider accepted" ? "Arkesel accepted the message; handset delivery is not yet confirmed." : label === "Delivered" ? "Confirmed by Arkesel or the mobile carrier." : label === "Failed" ? "Arkesel or the carrier reported a terminal failure." : label === "Unknown" ? "The outcome cannot safely be determined; the system will not resend automatically." : "Confirmed deliveries divided by accepted, delivered and failed provider outcomes."} className="rounded-xl bg-bg-soft p-3 text-center"><strong className="block text-lg">{value}</strong><small>{label}</small></div>)}
          </div>
          <p className="mt-3 text-xs text-text-muted">Sent means provider accepted. Delivered requires Arkesel/carrier confirmation. Unknown messages are not automatically retried.</p>
        </article>)}
      </div>
    </section>
  </div>;
}
