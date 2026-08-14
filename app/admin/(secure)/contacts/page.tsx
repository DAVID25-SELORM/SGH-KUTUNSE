import Link from "next/link";
import { ContactEditor } from "@/components/admin/ContactEditor";
import { AGE_GROUPS, CONTACT_SOURCES } from "@/lib/contacts";
import { humanizeFeedbackValue } from "@/lib/feedback-display";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";
import { ensureApprovedStaffContacts, ensureLegacyCampaignContacts } from "@/lib/server/feedback-contacts";
import { hasPermission } from "@/lib/types/admin";
type Params = { q?: string; source?: string; gender?: string; ageGroup?: string; facility?: string; tag?: string; consent?: string; status?: string };
type ContactRow = Record<string, unknown> & { id: string };
export default async function ContactsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const session = await requireAdmin("contacts");
  await ensureApprovedStaffContacts();
  await ensureLegacyCampaignContacts();
  const f = await searchParams;
  const snapshot = await adminDb.collection("feedback_contacts").limit(2000).get();
  const q = String(f.q ?? "").toLowerCase();
  const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactRow)).filter(contact =>
    (!q || [contact.fullName, contact.name, contact.phone, contact.email, contact.reference].some(value => String(value ?? "").toLowerCase().includes(q))) &&
    (!f.source || contact.source === f.source || (Array.isArray(contact.sources) && contact.sources.includes(f.source))) &&
    (!f.gender || contact.gender === f.gender) && (!f.ageGroup || contact.ageGroup === f.ageGroup) &&
    (!f.facility || String(contact.facility ?? "").toLowerCase().includes(f.facility.toLowerCase())) &&
    (!f.tag || (Array.isArray(contact.tags) && contact.tags.map(String).some(tag => tag.includes(f.tag!.toLowerCase())))) &&
    (!f.consent || (f.consent === "sms" ? contact.smsOptIn === true : f.consent === "email" ? contact.emailOptIn === true : contact.doNotContact === true)) &&
    (!f.status || contact.status === f.status));
  const manage = hasPermission(session.role, "contacts_manage");
  return <section><p className="text-sm font-semibold text-pink-accent">AUDIENCE MANAGEMENT</p><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-semibold text-purple-deep">Contacts</h1><p className="mt-2 text-sm text-text-muted">One normalized directory for messaging audiences and consent.</p></div><span className="rounded-full bg-purple-deep px-4 py-2 text-sm font-semibold text-white">{rows.length} contacts</span></div>
    {manage ? <details className="mt-6"><summary className="cursor-pointer rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white">Add contact</summary><div className="mt-4"><ContactEditor /></div></details> : null}
    <form className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4"><input name="q" defaultValue={f.q} placeholder="Name, phone, email or reference" className="rounded-xl border px-3 py-2"/><select name="source" defaultValue={f.source ?? ""} className="rounded-xl border px-3 py-2"><option value="">All sources</option>{CONTACT_SOURCES.map(item => <option key={item} value={item}>{humanizeFeedbackValue(item)}</option>)}</select><select name="gender" defaultValue={f.gender ?? ""} className="rounded-xl border px-3 py-2"><option value="">All genders</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select><select name="ageGroup" defaultValue={f.ageGroup ?? ""} className="rounded-xl border px-3 py-2"><option value="">All age groups</option>{AGE_GROUPS.map(item => <option key={item} value={item}>{humanizeFeedbackValue(item)}</option>)}</select><input name="facility" defaultValue={f.facility} placeholder="Facility or screening event" className="rounded-xl border px-3 py-2"/><input name="tag" defaultValue={f.tag} placeholder="Tag" className="rounded-xl border px-3 py-2"/><select name="consent" defaultValue={f.consent ?? ""} className="rounded-xl border px-3 py-2"><option value="">All consent states</option><option value="sms">SMS opted in</option><option value="email">Email opted in</option><option value="blocked">Do not contact</option></select><div className="flex gap-2"><button className="flex-1 rounded-xl bg-purple-deep px-4 py-2 font-semibold text-white">Apply filters</button><Link href="/admin/contacts" className="rounded-xl border px-4 py-2">Clear</Link></div></form>
    <div className="mt-6 overflow-hidden rounded-2xl border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-bg-soft"><tr><th className="p-4">Contact</th><th>Source</th><th>Demographics</th><th>Consent</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(contact => <tr key={contact.id} className="border-t"><td className="p-4"><strong>{String(contact.fullName || contact.name || "Name not provided")}</strong><p>{String(contact.phone ?? "")}</p><p className="text-xs text-text-muted">{String(contact.email ?? "")}</p></td><td>{humanizeFeedbackValue(contact.source)}</td><td>{humanizeFeedbackValue(contact.gender)} · {humanizeFeedbackValue(contact.ageGroup)}</td><td>{contact.doNotContact ? "Do not contact" : contact.smsOptIn ? "SMS opted in" : "No SMS consent"}</td><td>{humanizeFeedbackValue(contact.status)}</td><td className="pr-4"><Link href={`/admin/contacts/${contact.id}`} className="font-semibold text-purple-deep">View</Link></td></tr>)}</tbody></table></div>{!rows.length ? <p className="p-8 text-center text-text-muted">No contacts match these filters.</p> : null}</div>
  </section>;
}
