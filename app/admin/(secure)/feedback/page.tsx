import Link from "next/link";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";

type Row = Record<string, unknown> & { id: string };
const ratingLabels = { reception: "Reception", waitingTime: "Waiting time", professionalism: "Professionalism", cleanliness: "Cleanliness", communication: "Communication", overallQuality: "Overall quality" };
const text = (value: unknown) => String(value ?? "").toLowerCase();
const submissionDate = (value: unknown) => {
  const timestamp = value as { toDate?: () => Date } | null | undefined;
  return timestamp?.toDate?.().toISOString().slice(0, 10) ?? "";
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdmin("feedback");
  const filters = await searchParams;
  const snapshot = await adminDb.collection("feedback_responses").orderBy("createdAt", "desc").limit(200).get();
  const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Row[];
  const q = text(filters.q), status = text(filters.status), visit = text(filters.visitType), satisfaction = text(filters.satisfaction);
  const rows = all.filter((r) => (!q || [r.reference, r.serviceUnit, r.campaign].some((v) => text(v).includes(q))) && (!status || text(r.status) === status) && (!visit || text(r.visitType) === visit) && (!satisfaction || text(r.overallSatisfaction) === satisfaction));
  const average = (key: string) => rows.length ? rows.reduce((sum, r) => sum + Number((r.ratings as Record<string, unknown> | undefined)?.[key] ?? 0), 0) / rows.length : 0;
  const recommend = rows.filter((r) => ["definitely", "probably"].includes(text(r.recommendation))).length;
  const today = new Date().toISOString().slice(0, 10);
  const cards: Array<[string, string | number]> = [
    ["Total responses", rows.length], ["Responses today", rows.filter((r) => submissionDate(r.createdAt) === today).length],
    ["Average satisfaction", rows.length ? `${average("overallQuality").toFixed(1)} / 5` : "No data"],
    ["Recommendation rate", rows.length ? `${Math.round(recommend / rows.length * 100)}%` : "No data"],
    ["Needs review", rows.filter((r) => r.needsReview).length], ["Follow-ups requested", rows.filter((r) => r.contactRequested).length],
  ];
  return <section>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-pink-accent">PATIENT EXPERIENCE</p><h1 className="text-3xl font-semibold text-purple-deep">Feedback</h1></div>{["super_admin", "admin"].includes(session.role) ? <Link href="/admin/feedback/campaigns" className="rounded-xl bg-purple-deep px-4 py-3 font-semibold text-white">Send Feedback SMS</Link> : null}</div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border bg-white p-5"><p className="text-sm text-text-muted">{label}</p><p className="mt-2 text-2xl font-semibold text-purple-deep">{value}</p></div>)}</div>
    <div className="mt-6 rounded-2xl border bg-white p-5"><h2 className="font-semibold">Experience ratings</h2><div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{Object.entries(ratingLabels).map(([key,label]) => <div key={key}><p className="text-xs text-text-muted">{label}</p><strong>{rows.length ? average(key).toFixed(1) : "—"}</strong><span className="text-xs text-text-muted"> / 5</span></div>)}</div>{rows.length > 0 && rows.length < 5 ? <p className="mt-4 text-xs text-amber-700">Small sample: interpret these averages cautiously.</p> : null}</div>
    <form className="mt-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-5"><input name="q" defaultValue={typeof filters.q === "string" ? filters.q : ""} placeholder="Reference, service or campaign" className="rounded-xl border px-3 py-2"/><select name="status" defaultValue={status} className="rounded-xl border px-3 py-2"><option value="">All statuses</option>{["new","in_review","contacted","completed","archived"].map(v=><option key={v}>{v}</option>)}</select><select name="visitType" defaultValue={visit} className="rounded-xl border px-3 py-2"><option value="">All visit types</option><option value="health_screening">Health screening</option><option value="facility_visit">Facility visit</option></select><select name="satisfaction" defaultValue={satisfaction} className="rounded-xl border px-3 py-2"><option value="">All satisfaction</option>{["very_satisfied","satisfied","neutral","dissatisfied","very_dissatisfied"].map(v=><option key={v}>{v}</option>)}</select><button className="rounded-xl bg-purple-deep px-4 py-2 font-semibold text-white">Apply filters</button></form>
    <div className="mt-6 overflow-hidden rounded-2xl border bg-white"><div className="border-b p-4"><h2 className="font-semibold">Feedback inbox · newest first</h2><p className="text-xs text-text-muted">Showing up to 200 recent responses.</p></div>{rows.map((r) => <Link key={r.id} href={`/admin/feedback/${r.id}`} className="grid gap-2 border-b p-4 hover:bg-bg-soft sm:grid-cols-6"><strong>{String(r.reference)}</strong><span>{String(r.visitType).replaceAll("_", " ")}</span><span>{String(r.serviceUnit ?? "Health screening")}</span><span>{String(r.overallSatisfaction).replaceAll("_", " ")}</span><span>{r.contactRequested ? "Follow-up" : r.needsReview ? "Needs review" : "Routine"}</span><span>{String(r.status)}</span></Link>)}{!rows.length ? <p className="p-8 text-center text-text-muted">No feedback matches these filters.</p> : null}</div>
    <div className="mt-6 rounded-2xl border bg-white p-5"><h2 className="font-semibold">Staff and service appreciation</h2><div className="mt-4 space-y-3">{rows.filter(r => r.appreciation).slice(0, 10).map(r => <blockquote key={r.id} className="rounded-xl bg-bg-soft p-4 text-sm">“{String(r.appreciation)}” <span className="text-text-muted">— {String(r.serviceUnit ?? r.visitType)}</span></blockquote>)}{!rows.some(r => r.appreciation) ? <p className="text-sm text-text-muted">No appreciation comments in this view.</p> : null}</div></div>
  </section>;
}
