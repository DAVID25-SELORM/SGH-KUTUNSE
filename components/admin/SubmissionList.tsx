import Link from "next/link";
import { requireAdmin } from "@/lib/server/auth";
import { listSubmissions, type InboxQuery } from "@/lib/server/admin-data";
import { submissionKinds, SUBMISSION_STATUSES, type SubmissionKind } from "@/lib/types/submissions";

export async function SubmissionList({ kind, filters }: { kind: SubmissionKind; filters: InboxQuery }) {
  const config = submissionKinds[kind]; await requireAdmin(config.permission);
  const { rows, nextCursor } = await listSubmissions(kind, filters);
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => Boolean(value)) as string[][]);
  return <section>
    <div className="mb-6"><p className="text-sm font-semibold text-pink-accent">REQUEST INBOX</p><h1 className="text-3xl font-semibold text-purple-deep">{config.label}</h1></div>
    <form className="mb-5 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
      <input name="search" defaultValue={filters.search} maxLength={80} placeholder="Search exact name, phone or reference term" className="rounded-xl border border-border-default px-3 py-2 lg:col-span-2" />
      <select name="status" defaultValue={filters.status ?? ""} className="rounded-xl border border-border-default bg-white px-3 py-2"><option value="">All statuses</option>{SUBMISSION_STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
      <input name="from" type="date" defaultValue={filters.from} aria-label="From date" className="rounded-xl border border-border-default px-3 py-2" />
      <input name="to" type="date" defaultValue={filters.to} aria-label="To date" className="rounded-xl border border-border-default px-3 py-2" />
      <div className="flex gap-2 lg:col-span-5"><button className="rounded-xl bg-purple-deep px-4 py-2 font-semibold text-white">Apply filters</button><Link href={`/admin/${kind}`} className="rounded-xl border border-border-default px-4 py-2 font-semibold">Clear</Link></div>
    </form>
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-bg-soft"><tr><th className="p-4">Reference</th><th className="p-4">Name / organisation</th><th className="p-4">Status</th><th className="p-4">Created</th></tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)} className="border-t border-border-default"><td className="p-4"><Link className="font-semibold text-purple-deep" href={`/admin/${kind}/${row.id}`}>{String(row.reference)}</Link></td><td className="p-4">{String(row.fullName ?? row.contactName ?? row.companyName ?? "—")}</td><td className="p-4">{String(row.status)}</td><td className="p-4">{row.createdAt ? new Date(String(row.createdAt)).toLocaleString() : "Pending"}</td></tr>)}</tbody></table>{!rows.length && <p className="p-8 text-center text-text-muted">No requests match these filters.</p>}</div>
    <div className="mt-5 flex justify-between"><span className="text-sm text-text-muted">Up to 20 results per page, newest first.</span>{nextCursor && <Link className="rounded-xl bg-purple-deep px-4 py-2 text-sm font-semibold text-white" href={`/admin/${kind}?${query.toString()}&cursor=${encodeURIComponent(nextCursor)}`}>Next page</Link>}</div>
  </section>;
}
