import { FeedbackContactForm } from "@/components/admin/FeedbackContactForm";
import { humanizeFeedbackValue } from "@/lib/feedback-display";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";
import { ensureApprovedStaffContacts } from "@/lib/server/feedback-contacts";

export default async function FeedbackContactsPage({ searchParams }: { searchParams: Promise<{ q?: string; source?: string }> }) {
  await requireAdmin("feedback_campaigns");
  await ensureApprovedStaffContacts();
  const filters = await searchParams;
  const q = String(filters.q ?? "").trim().toLowerCase();
  const source = String(filters.source ?? "");
  const snapshot = await adminDb.collection("feedback_contacts").orderBy("createdAt", "desc").limit(1000).get();
  const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name?: string; phone?: string; source?: string; status?: string })).filter(contact => {
    const values = `${String(contact.name ?? "")} ${String(contact.phone ?? "")}`.toLowerCase();
    return (!q || values.includes(q)) && (!source || contact.source === source);
  });
  return <section>
    <p className="text-sm font-semibold text-pink-accent">PATIENT EXPERIENCE</p>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold text-purple-deep">Feedback contacts</h1><p className="mt-2 text-sm text-text-muted">Contacts available for controlled feedback SMS campaigns.</p></div><span className="rounded-full bg-purple-deep px-4 py-2 text-sm font-semibold text-white">{contacts.length} shown</span></div>
    <div className="mt-6 rounded-2xl border bg-bg-soft p-5"><h2 className="text-lg font-semibold">Add contact</h2><FeedbackContactForm /></div>
    <form className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-[1fr_220px_auto]"><input name="q" defaultValue={filters.q ?? ""} placeholder="Search name or phone" className="rounded-xl border px-3 py-2"/><select name="source" defaultValue={source} className="rounded-xl border px-3 py-2"><option value="">All sources</option>{["staff","health_screening","facility","outpatient","reception","laboratory","pharmacy","other"].map(item => <option key={item} value={item}>{humanizeFeedbackValue(item)}</option>)}</select><button className="rounded-xl bg-purple-deep px-5 py-2 font-semibold text-white">Apply filters</button></form>
    <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-bg-soft"><tr><th className="p-4">Name</th><th className="p-4">Phone</th><th className="p-4">Source</th><th className="p-4">Status</th></tr></thead><tbody>{contacts.map(contact => <tr key={contact.id} className="border-t"><td className="p-4 font-semibold">{String(contact.name || "Not provided")}</td><td className="p-4">{String(contact.phone)}</td><td className="p-4">{humanizeFeedbackValue(contact.source)}</td><td className="p-4">{humanizeFeedbackValue(contact.status)}</td></tr>)}</tbody></table></div>{!contacts.length ? <p className="p-8 text-center text-text-muted">No contacts match these filters.</p> : null}</div>
  </section>;
}
