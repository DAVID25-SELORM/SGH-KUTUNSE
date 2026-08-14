import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, HeartHandshake, MessageSquareText, UserRoundCheck } from "lucide-react";
import { FeedbackActions } from "@/components/admin/FeedbackActions";
import { requireAdmin } from "@/lib/server/auth";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { hasPermission } from "@/lib/types/admin";
import { writeAudit } from "@/lib/server/audit";
import { feedbackEventLabel, feedbackStatusLabel, formatFeedbackDate, formatGhs, humanizeFeedbackValue } from "@/lib/feedback-display";
import type { SubmissionStatus } from "@/lib/types/submissions";

const value = (data: FirebaseFirestore.DocumentData, key: string) => humanizeFeedbackValue(data[key]);
const provided = (input: unknown) => input === null || input === undefined || String(input).trim() === "" ? "Not provided" : String(input);
const statusStyles: Record<string, string> = {
  new: "bg-blue-50 text-blue-800", in_review: "bg-amber-50 text-amber-800",
  contacted: "bg-cyan-50 text-cyan-800", completed: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-red-50 text-red-800", archived: "bg-gray-100 text-gray-700",
};
const ratingLabels: Record<string, string> = {
  reception: "Reception / Welcome", waitingTime: "Waiting Time", professionalism: "Staff Professionalism",
  cleanliness: "Cleanliness & Comfort", communication: "Communication", overallQuality: "Overall Quality",
};

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-text-dark">{children}</dd></div>;
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin("feedback");
  const { id } = await params;
  if (!/^[\w-]{1,128}$/.test(id)) notFound();
  const doc = await adminDb.collection("feedback_responses").doc(id).get();
  if (!doc.exists) notFound();
  const data = doc.data()!;
  const [notes, history] = await Promise.all([
    doc.ref.collection("internal_notes").orderBy("createdAt", "desc").limit(20).get(),
    doc.ref.collection("history").orderBy("createdAt", "desc").limit(50).get(),
  ]);
  const canManage = hasPermission(session.role, "feedback_manage");
  const canReceipt = hasPermission(session.role, "feedback_receipts");
  if (data.receiptRestricted && canReceipt) await writeAudit(session.uid, "feedback.receipt_viewed", "feedback", id);
  const administrators = canManage ? (await adminAuth.listUsers(100)).users
    .filter((user) => !user.disabled && user.customClaims?.role)
    .map((user) => ({ uid: user.uid, label: `${user.displayName ?? user.email ?? "Administrator"} · ${humanizeFeedbackValue(user.customClaims?.role)}` })) : [];
  const receipt = (data.receiptDetails ?? {}) as Record<string, unknown>;
  const ratings = (data.ratings ?? {}) as Record<string, unknown>;
  const status = String(data.status ?? "new") as SubmissionStatus;

  return <section className="mx-auto max-w-7xl">
    <Link href="/admin/feedback" className="inline-flex min-h-11 items-center rounded-xl border bg-white px-4 py-2 font-semibold text-purple-deep hover:bg-bg-soft">← Back to Feedback Inbox</Link>

    <header className="mt-5 rounded-3xl bg-gradient-to-br from-purple-deep to-purple-dark p-6 text-white shadow-sm sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-100">Feedback Response</p><h1 className="mt-2 break-all text-2xl font-semibold sm:text-3xl">{String(data.reference)}</h1><p className="mt-2 text-sm text-purple-100">Submitted {formatFeedbackDate(data.createdAt, true)}</p></div>
        <span className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${statusStyles[status] ?? "bg-white/15 text-white"}`}>{feedbackStatusLabel(status)}</span>
      </div>
      <dl className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{[["Visit type", value(data, "visitType")], ["Visit date", formatFeedbackDate(data.visitDate)], ["Satisfaction", value(data, "overallSatisfaction")], ["Recommendation", value(data, "recommendation")], ["Follow-up requested", value(data, "contactRequested")]].map(([label, content]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-purple-200">{label}</dt><dd className="mt-1 text-sm font-semibold text-white">{content}</dd></div>)}</dl>
    </header>

    {data.contactRequested && <section className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-cyan-950"><div className="flex gap-3"><HeartHandshake className="mt-0.5 shrink-0"/><div><h2 className="font-semibold">Patient requested follow-up</h2><p className="mt-1 text-sm">Preferred contact method: <strong>{value(data, "preferredContact")}</strong>. Please assign and record contact activity promptly.</p></div></div></section>}

    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><ClipboardList className="text-purple-deep"/><h2 className="text-lg font-semibold text-purple-deep">Response Overview</h2></div><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Detail label="Reference">{String(data.reference)}</Detail><Detail label="Workflow status">{feedbackStatusLabel(status)}</Detail><Detail label="Service / unit">{value(data, "serviceUnit")}</Detail><Detail label="Other service">{value(data, "otherService")}</Detail><Detail label="Visit date">{formatFeedbackDate(data.visitDate)}</Detail><Detail label="Submitted">{formatFeedbackDate(data.createdAt, true)}</Detail></dl></section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><CheckCircle2 className="text-purple-deep"/><h2 className="text-lg font-semibold text-purple-deep">Patient Experience</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Object.entries(ratingLabels).map(([key, label]) => <div key={key} className="rounded-xl bg-bg-soft p-4"><p className="text-xs font-semibold text-text-muted">{label}</p><p className="mt-2 text-xl font-semibold text-purple-deep">{ratings[key] ? `${ratings[key]} / 5` : "Not provided"}</p></div>)}</div><dl className="mt-5 grid gap-5 sm:grid-cols-2"><Detail label="Overall satisfaction">{value(data, "overallSatisfaction")}</Detail><Detail label="Would recommend">{value(data, "recommendation")}</Detail><Detail label="Dissatisfied area">{value(data, "dissatisfactionAspect")}</Detail><Detail label="What could improve">{value(data, "improvementDetails")}</Detail></dl></section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><MessageSquareText className="text-purple-deep"/><h2 className="text-lg font-semibold text-purple-deep">Comments & Appreciation</h2></div><div className="mt-5 space-y-5"><div><h3 className="text-xs font-semibold uppercase text-text-muted">Comments or suggestions</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{provided(data.comments)}</p></div><div className="rounded-xl bg-pink-accent/5 p-4"><h3 className="text-xs font-semibold uppercase text-pink-dark">Staff or service appreciation</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{provided(data.appreciation)}</p></div></div></section>

        <section className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${data.receiptConcern === "yes" ? "border-amber-300 bg-amber-50" : "bg-white"}`}><div className="flex items-center gap-3"><AlertTriangle className={data.receiptConcern === "yes" ? "text-amber-700" : "text-text-muted"}/><h2 className="text-lg font-semibold">Financial/Receipt Concern</h2></div><p className="mt-3 text-sm">Payment without an official receipt: <strong>{value(data, "receiptConcern")}</strong></p>{data.receiptConcern === "yes" ? canReceipt ? <dl className="mt-5 grid gap-5 sm:grid-cols-2"><Detail label="Unit / Department">{provided(receipt.unit)}</Detail><Detail label="Person / Staff Member">{provided(receipt.person)}</Detail><Detail label="Amount">{formatGhs(receipt.amount)}</Detail><Detail label="Explanation">{provided(receipt.explanation ?? receipt.description)}</Detail></dl> : <p className="mt-4 rounded-xl bg-white/70 p-4 text-sm font-medium">Details are restricted to specifically authorized management.</p> : <p className="mt-3 text-sm text-text-muted">No financial or receipt concern was reported.</p>}</section>
      </div>

      <aside className="space-y-6">
        <section className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${data.contactRequested ? "border-cyan-200 bg-cyan-50" : "bg-white"}`}><div className="flex items-center gap-3"><UserRoundCheck className="text-purple-deep"/><h2 className="text-lg font-semibold text-purple-deep">Follow-up & Contact</h2></div><dl className="mt-5 grid gap-5"><Detail label="Follow-up requested">{value(data, "contactRequested")}</Detail><Detail label="Preferred method">{value(data, "preferredContact")}</Detail>{canManage ? <><Detail label="Name">{provided(data.contactName)}</Detail><Detail label="Phone">{provided(data.contactPhone)}</Detail><Detail label="Email">{provided(data.contactEmail)}</Detail></> : data.contactRequested ? <p className="rounded-xl bg-white/70 p-3 text-sm">Contact details are restricted to authorized follow-up staff.</p> : null}<Detail label="Assigned administrator">{data.assignedTo ? administrators.find((admin) => admin.uid === data.assignedTo)?.label ?? "Assigned administrator" : "Unassigned"}</Detail></dl></section>
        {canManage && <FeedbackActions id={id} status={status} assignedTo={data.assignedTo ?? null} administrators={administrators} />}
      </aside>
    </div>

    <section className="mt-6 rounded-2xl border bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><CalendarDays className="text-purple-deep"/><h2 className="text-lg font-semibold text-purple-deep">Activity & History</h2></div><ol className="mt-5 space-y-4">{history.docs.filter((event) => event.data().action !== "internal_note_added").map((event) => <li key={event.id} className="grid gap-1 border-l-2 border-purple-deep pl-4 sm:grid-cols-[1fr_auto]"><div><strong>{feedbackEventLabel(event.data().action)}</strong><p className="text-sm text-text-muted">{String(event.data().actorDisplayName ?? "System")}</p></div><time className="text-xs text-text-muted">{formatFeedbackDate(event.data().createdAt, true)}</time></li>)}{notes.docs.map((note) => <li key={note.id} className="grid gap-2 rounded-xl bg-bg-soft p-4 sm:grid-cols-[1fr_auto]"><div><strong>Internal note</strong><p className="mt-1 whitespace-pre-wrap break-words text-sm">{String(note.data().text ?? "Not provided")}</p><p className="mt-2 text-xs text-text-muted">{String(note.data().authorDisplayName ?? "Administrator")}</p></div><time className="text-xs text-text-muted">{formatFeedbackDate(note.data().createdAt, true)}</time></li>)}</ol></section>

    <details className="mt-6 rounded-2xl border bg-white p-5 text-sm"><summary className="cursor-pointer font-semibold text-purple-deep">Technical details</summary><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Detail label="Document ID">{id}</Detail><Detail label="Campaign ID">{provided(data.campaign)}</Detail><Detail label="Submission source">{humanizeFeedbackValue(data.source)}</Detail><Detail label="Priority">{humanizeFeedbackValue(data.priority)}</Detail></dl></details>
  </section>;
}
