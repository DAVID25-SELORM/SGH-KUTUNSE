import Link from "next/link";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";
import { submissionKinds } from "@/lib/types/submissions";
import { calculateDashboardStats, dateFromRecord } from "@/lib/dashboard-stats";
import { hasPermission } from "@/lib/types/admin";
import {
  getWebsiteAnalytics,
  resolveAnalyticsRange,
} from "@/lib/server/website-analytics";

export default async function Dashboard() {
  const session = await requireAdmin();
  const now = new Date();
  const followUpHours = Math.max(1, Number(process.env.FOLLOW_UP_HOURS ?? 48));
  const analytics = hasPermission(session.roles, "analytics_view")
    ? await getWebsiteAnalytics(resolveAnalyticsRange("today"))
    : null;
  const [cards, scheduled, activity] = await Promise.all([
    Promise.all(
      Object.entries(submissionKinds).map(async ([kind, c]) => {
        const snapshot = await adminDb
          .collection(c.collection)
          .select("status", "createdAt")
          .get();
        return {
          kind,
          label: c.label,
          ...calculateDashboardStats(
            snapshot.docs.map((doc) => doc.data()),
            now,
            followUpHours,
          ),
        };
      }),
    ),
    adminDb
      .collection("feedback_campaigns")
      .where("status", "==", "scheduled")
      .select("scheduledAt")
      .get(),
    adminDb
      .collection("admin_notifications")
      .orderBy("createdAt", "desc")
      .limit(12)
      .get(),
  ]);
  const nextScheduled = scheduled.docs
    .map((doc) => dateFromRecord(doc.data().scheduledAt))
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const recent = activity.docs
    .filter((doc) => {
      const type = String(doc.get("type"));
      return (
        type in submissionKinds &&
        hasPermission(
          session.roles,
          submissionKinds[type as keyof typeof submissionKinds].permission,
        )
      );
    })
    .slice(0, 5);
  return (
    <section>
      <p className="text-sm font-semibold text-pink-accent">
        OPERATIONAL OVERVIEW
      </p>
      <h1 className="text-3xl font-semibold text-purple-deep">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.kind}
            href={`/admin/${card.kind}`}
            className="rounded-2xl bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-text-muted">{card.label}</p>
            <p className="mt-2 text-4xl font-semibold text-purple-deep">
              {card.count}
              <span className="ml-2 text-xs font-medium text-text-muted">
                new
              </span>
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <span className="rounded-lg bg-bg-soft p-2">
                {card.today}
                <br />
                today
              </span>
              <span className="rounded-lg bg-bg-soft p-2">
                {card.week}
                <br />7 days
              </span>
              <span className="rounded-lg bg-bg-soft p-2">
                {card.overdue}
                <br />
                follow-up
              </span>
            </div>
          </Link>
        ))}
        <Link
          href="/admin/feedback/campaigns"
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          <p className="text-sm text-text-muted">Scheduled feedback SMS</p>
          <p className="mt-2 text-4xl font-semibold text-purple-deep">
            {scheduled.size}
          </p>
          <p className="mt-4 text-sm">
            {nextScheduled
              ? `Next: ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" }).format(nextScheduled)}`
              : "No campaign scheduled"}
          </p>
        </Link>
        {analytics ? (
          <Link
            href="/admin/analytics?range=today"
            className="rounded-2xl bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-text-muted">Website today</p>
            {analytics.available ? (
              <>
                <p className="mt-2 text-4xl font-semibold text-purple-deep">
                  {analytics.summary.visitors}
                  <span className="ml-2 text-xs font-medium text-text-muted">
                    visitors
                  </span>
                </p>
                <p className="mt-4 text-sm">
                  {analytics.summary.pageViews} page views ·{" "}
                  {analytics.summary.activeRecently} active recently
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-text-muted">
                Analytics reporting is not yet connected.
              </p>
            )}
            <p className="mt-3 text-sm font-semibold text-purple-deep">
              View analytics
            </p>
          </Link>
        ) : null}
      </div>
      <p className="mt-5 text-sm text-text-muted">
        Follow-up means new or in-review for more than {followUpHours} hours.
        Hospital approval of this threshold is required.
      </p>
      <section className="mt-7 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">Recent notifications</h2>
          <Link
            href="/admin/notifications"
            className="font-semibold text-purple-deep"
          >
            View all
          </Link>
        </div>
        <div className="mt-3 divide-y">
          {recent.map((doc) => (
            <Link
              key={doc.id}
              href={String(doc.get("targetUrl"))}
              className="flex justify-between gap-3 py-3"
            >
              <span>
                <strong className="block">{String(doc.get("title"))}</strong>
                <small>{String(doc.get("reference"))}</small>
              </span>
              <small>
                {doc
                  .get("createdAt")
                  ?.toDate?.()
                  ?.toLocaleString?.("en-GB", { timeZone: "Africa/Accra" }) ??
                  "Just now"}
              </small>
            </Link>
          ))}
          {!recent.length && (
            <p className="py-4 text-sm text-text-muted">
              No recent notifications.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
