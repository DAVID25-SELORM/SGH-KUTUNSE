import Link from "next/link";
import { requireAdmin } from "@/lib/server/auth";
import {
  getWebsiteAnalytics,
  resolveAnalyticsRange,
} from "@/lib/server/website-analytics";

const formatNumber = new Intl.NumberFormat("en-GH");
const formatDateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Accra",
});

function Card({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-border-default bg-white p-5 shadow-sm">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-purple-deep">
        {formatNumber.format(value)}
      </p>
      {note ? <p className="mt-1 text-xs text-text-muted">{note}</p> : null}
    </div>
  );
}

function Table({
  headings,
  rows,
}: {
  headings: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-border-default">
            {headings.map((heading) => (
              <th key={heading} className="px-3 py-3 font-semibold">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className="border-b border-border-default/60 last:border-0"
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("analytics_view");
  const query = await searchParams;
  const value = (key: string) =>
    typeof query[key] === "string" ? query[key] : undefined;
  const range = resolveAnalyticsRange(
    value("range"),
    value("start"),
    value("end"),
  );
  const analytics = await getWebsiteAnalytics(range);
  const maxViews = Math.max(
    1,
    ...analytics.trend.map((item) => item.pageViews),
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-pink-accent">
            AGGREGATE TRAFFIC &amp; ENGAGEMENT
          </p>
          <h1 className="text-3xl font-semibold text-purple-deep">
            Website Analytics
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Privacy-conscious GA4 reporting. No patient records or individual
            visitor identities are shown.
          </p>
        </div>
        <p className="text-sm text-text-muted">
          Last updated: {formatDateTime.format(new Date(analytics.lastUpdated))}
        </p>
      </div>

      <form
        className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
        method="get"
      >
        <label className="text-sm font-semibold">
          Date range
          <select
            name="range"
            defaultValue={range.preset}
            className="mt-1 min-h-11 w-full rounded-xl border border-border-default px-3"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="month">This month</option>
            <option value="custom">Custom range</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Start date
          <input
            type="date"
            name="start"
            defaultValue={range.preset === "custom" ? range.startDate : ""}
            max={range.endDate}
            className="mt-1 min-h-11 w-full rounded-xl border border-border-default px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          End date
          <input
            type="date"
            name="end"
            defaultValue={range.preset === "custom" ? range.endDate : ""}
            max={new Date().toISOString().slice(0, 10)}
            className="mt-1 min-h-11 w-full rounded-xl border border-border-default px-3"
          />
        </label>
        <button className="min-h-11 self-end rounded-xl bg-purple-deep px-5 font-semibold text-white">
          Apply / Refresh
        </button>
      </form>

      {!analytics.available ? (
        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50 p-6"
        >
          <h2 className="text-lg font-semibold text-amber-900">
            Analytics data is temporarily unavailable.
          </h2>
          <p className="mt-2 text-sm text-amber-900">{analytics.error}</p>
          {!analytics.configured ? (
            <p className="mt-2 text-sm text-amber-900">
              Connect the existing GA4 property by setting{" "}
              <code>GA4_PROPERTY_ID</code> on App Hosting and granting its
              runtime service account Analytics Viewer access. Do not create
              another property.
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              label={`Visitors · ${range.label}`}
              value={analytics.summary.visitors}
            />
            <Card
              label="Unique visitors"
              value={analytics.summary.uniqueVisitors}
            />
            <Card label="Page views" value={analytics.summary.pageViews} />
            <Card
              label="Active · last 30 minutes"
              value={analytics.summary.activeRecently}
              note="GA4 real-time aggregate"
            />
            <Card label="Sessions" value={analytics.summary.sessions} />
            <Card label="New visitors" value={analytics.summary.newVisitors} />
            <Card
              label="Returning visitors"
              value={analytics.summary.returningVisitors}
            />
            <Card
              label="Views per visitor"
              value={
                analytics.summary.visitors
                  ? Math.round(
                      analytics.summary.pageViews / analytics.summary.visitors,
                    )
                  : 0
              }
            />
          </div>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Traffic trend</h2>
            <p className="text-sm text-text-muted">
              Visitors, sessions and page views in {TIME_ZONE_LABEL}.
            </p>
            <div
              className="mt-5 flex min-h-56 items-end gap-2 overflow-x-auto"
              aria-label="Page view trend"
            >
              {analytics.trend.map((item) => (
                <div
                  key={item.date}
                  className="flex min-w-12 flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-semibold">
                    {item.pageViews}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-purple-deep"
                    style={{
                      height: `${Math.max(4, (item.pageViews / maxViews) * 160)}px`,
                    }}
                    title={`${item.visitors} visitors, ${item.sessions} sessions, ${item.pageViews} views`}
                  />
                  <span className="text-[10px] text-text-muted">
                    {item.date.slice(4)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xl font-semibold">Top pages</h2>
              <Table
                headings={["Page", "Views", "Visitors", "Avg engagement"]}
                rows={analytics.topPages.slice(0, 15).map((item) => [
                  <span key="page">
                    <strong className="block">{item.title}</strong>
                    <small className="text-text-muted">{item.path}</small>
                  </span>,
                  formatNumber.format(item.views),
                  formatNumber.format(item.visitors),
                  `${item.visitors ? Math.round(item.engagementSeconds / item.visitors) : 0}s`,
                ])}
              />
            </section>
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xl font-semibold">Traffic sources</h2>
              <Table
                headings={["Channel", "Source / medium", "Sessions", "Users"]}
                rows={analytics.sources.map((item) => [
                  item.channel,
                  item.sourceMedium,
                  formatNumber.format(item.sessions),
                  formatNumber.format(item.users),
                ])}
              />
            </section>
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xl font-semibold">Devices</h2>
              <Table
                headings={["Device", "Users", "Sessions"]}
                rows={analytics.devices.map((item) => [
                  item.device,
                  formatNumber.format(item.users),
                  formatNumber.format(item.sessions),
                ])}
              />
            </section>
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-xl font-semibold">Geography</h2>
              <p className="mb-3 text-sm text-text-muted">
                Aggregate country and region only.
              </p>
              <Table
                headings={["Country", "Region", "Users"]}
                rows={analytics.geography.map((item) => [
                  item.country,
                  item.region,
                  formatNumber.format(item.users),
                ])}
              />
            </section>
          </div>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Form conversions</h2>
            <p className="mb-3 text-sm text-text-muted">
              Page views and Firestore submissions use the same selected date
              range. No form contents are included.
            </p>
            <Table
              headings={[
                "Form",
                "Page views",
                "Submissions",
                "Conversion rate",
              ]}
              rows={analytics.conversions.map((item) => [
                item.label,
                formatNumber.format(item.views),
                formatNumber.format(item.submissions),
                item.rate === null
                  ? "Not available"
                  : `${item.rate.toFixed(1)}%`,
              ])}
            />
          </section>
        </>
      )}
      <p className="text-xs text-text-muted">
        GA4 metrics are aggregate and may be subject to processing delays,
        thresholding and provider definitions.{" "}
        <Link href="/privacy" className="font-semibold text-purple-deep">
          Privacy policy
        </Link>
      </p>
    </section>
  );
}

const TIME_ZONE_LABEL = "Africa/Accra (GMT)";
