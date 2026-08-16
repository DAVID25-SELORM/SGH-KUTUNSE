import "server-only";

import { GoogleAuth } from "google-auth-library";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/firebase-admin";

const DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const TIME_ZONE = "Africa/Accra";

export type AnalyticsPreset =
  "today" | "yesterday" | "7days" | "30days" | "month" | "custom";

export type AnalyticsRange = {
  preset: AnalyticsPreset;
  startDate: string;
  endDate: string;
  label: string;
};

type DataRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};
type Report = { rows?: DataRow[]; totals?: DataRow[] };

export type WebsiteAnalytics = {
  available: boolean;
  configured: boolean;
  error?: string;
  range: AnalyticsRange;
  lastUpdated: string;
  summary: {
    visitors: number;
    uniqueVisitors: number;
    pageViews: number;
    sessions: number;
    newVisitors: number;
    returningVisitors: number;
    activeRecently: number;
  };
  trend: Array<{
    date: string;
    visitors: number;
    sessions: number;
    pageViews: number;
  }>;
  topPages: Array<{
    path: string;
    title: string;
    views: number;
    visitors: number;
    engagementSeconds: number;
  }>;
  sources: Array<{
    channel: string;
    sourceMedium: string;
    sessions: number;
    users: number;
  }>;
  devices: Array<{ device: string; users: number; sessions: number }>;
  geography: Array<{ country: string; region: string; users: number }>;
  conversions: Array<{
    label: string;
    views: number;
    submissions: number;
    rate: number | null;
  }>;
};

const emptySummary = {
  visitors: 0,
  uniqueVisitors: 0,
  pageViews: 0,
  sessions: 0,
  newVisitors: 0,
  returningVisitors: 0,
  activeRecently: 0,
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function accraToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

function addDays(value: string, amount: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return isoDate(date);
}

export function resolveAnalyticsRange(
  presetValue?: string,
  customStart?: string,
  customEnd?: string,
  now = new Date(),
): AnalyticsRange {
  const today = accraToday(now);
  const preset: AnalyticsPreset = [
    "today",
    "yesterday",
    "7days",
    "30days",
    "month",
    "custom",
  ].includes(presetValue ?? "")
    ? (presetValue as AnalyticsPreset)
    : "7days";
  if (
    preset === "custom" &&
    /^\d{4}-\d{2}-\d{2}$/.test(customStart ?? "") &&
    /^\d{4}-\d{2}-\d{2}$/.test(customEnd ?? "") &&
    customStart! <= customEnd! &&
    customEnd! <= today
  ) {
    return {
      preset,
      startDate: customStart!,
      endDate: customEnd!,
      label: `${customStart} to ${customEnd}`,
    };
  }
  if (preset === "today")
    return { preset, startDate: today, endDate: today, label: "Today" };
  if (preset === "yesterday") {
    const yesterday = addDays(today, -1);
    return {
      preset,
      startDate: yesterday,
      endDate: yesterday,
      label: "Yesterday",
    };
  }
  if (preset === "30days")
    return {
      preset,
      startDate: addDays(today, -29),
      endDate: today,
      label: "Last 30 days",
    };
  if (preset === "month")
    return {
      preset,
      startDate: `${today.slice(0, 7)}-01`,
      endDate: today,
      label: "This month",
    };
  return {
    preset: "7days",
    startDate: addDays(today, -6),
    endDate: today,
    label: "Last 7 days",
  };
}

function numberAt(row: DataRow | undefined, index: number) {
  return Number(row?.metricValues?.[index]?.value ?? 0) || 0;
}

function textAt(row: DataRow, index: number) {
  return row.dimensionValues?.[index]?.value ?? "Unknown";
}

async function accessToken() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token)
    throw new Error("Google Analytics access token unavailable");
  return token.token;
}

async function query(
  endpoint: "runReport" | "runRealtimeReport",
  body: object,
): Promise<Report> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  if (!propertyId || !/^\d+$/.test(propertyId))
    throw new Error("GA4_PROPERTY_ID is not configured");
  const response = await fetch(
    `${DATA_API}/properties/${propertyId}:${endpoint}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await accessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: endpoint === "runRealtimeReport" ? 60 : 900 },
    },
  );
  if (!response.ok)
    throw new Error(
      `Google Analytics Data API returned HTTP ${response.status}`,
    );
  return (await response.json()) as Report;
}

async function historical(
  range: AnalyticsRange,
  dimensions: string[],
  metrics: string[],
  limit = 100,
) {
  return query("runReport", {
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    limit: String(limit),
    orderBys: metrics.length
      ? [{ metric: { metricName: metrics[0] }, desc: true }]
      : undefined,
  });
}

const forms = [
  {
    label: "Appointments",
    path: "/appointments",
    collection: "appointment_requests",
  },
  { label: "Contact", path: "/contact", collection: "contact_messages" },
  {
    label: "Corporate",
    path: "/corporate-wellness",
    collection: "corporate_enquiries",
  },
  {
    label: "Insurance",
    path: "/insurance",
    collection: "insurance_verifications",
  },
  {
    label: "Telemedicine",
    path: "/telemedicine",
    collection: "telemedicine_requests",
  },
  { label: "Feedback", path: "/feedback", collection: "feedback_responses" },
] as const;

async function submissionCounts(range: AnalyticsRange) {
  const start = Timestamp.fromDate(new Date(`${range.startDate}T00:00:00Z`));
  const end = Timestamp.fromDate(
    new Date(`${addDays(range.endDate, 1)}T00:00:00Z`),
  );
  return Promise.all(
    forms.map(async (form) => {
      const aggregate = await adminDb
        .collection(form.collection)
        .where("createdAt", ">=", start)
        .where("createdAt", "<", end)
        .count()
        .get();
      return aggregate.data().count;
    }),
  );
}

export async function getWebsiteAnalytics(
  range: AnalyticsRange,
): Promise<WebsiteAnalytics> {
  const base = {
    available: false,
    configured: Boolean(process.env.GA4_PROPERTY_ID?.trim()),
    range,
    lastUpdated: new Date().toISOString(),
  };
  if (!base.configured) {
    return {
      ...base,
      error: "The existing GA4 property is not connected to server reporting.",
      summary: emptySummary,
      trend: [],
      topPages: [],
      sources: [],
      devices: [],
      geography: [],
      conversions: [],
    };
  }
  try {
    const [
      summaryReport,
      trendReport,
      pagesReport,
      sourcesReport,
      devicesReport,
      geoReport,
      realtimeReport,
      submissions,
    ] = await Promise.all([
      historical(
        range,
        [],
        [
          "activeUsers",
          "totalUsers",
          "screenPageViews",
          "sessions",
          "newUsers",
          "returningUsers",
        ],
      ),
      historical(
        range,
        ["date"],
        ["activeUsers", "sessions", "screenPageViews"],
        400,
      ),
      historical(
        range,
        ["pagePath", "pageTitle"],
        ["screenPageViews", "activeUsers", "userEngagementDuration"],
        100,
      ),
      historical(
        range,
        ["sessionDefaultChannelGroup", "sessionSourceMedium"],
        ["sessions", "activeUsers"],
        50,
      ),
      historical(range, ["deviceCategory"], ["activeUsers", "sessions"], 10),
      historical(range, ["country", "region"], ["activeUsers"], 50),
      query("runRealtimeReport", {
        metrics: [{ name: "activeUsers" }],
        minuteRanges: [
          { name: "last_30_minutes", startMinutesAgo: 29, endMinutesAgo: 0 },
        ],
      }),
      submissionCounts(range),
    ]);
    const total = summaryReport.rows?.[0] ?? summaryReport.totals?.[0];
    const pageRows = pagesReport.rows ?? [];
    const conversions = forms.map((form, index) => {
      const views = pageRows
        .filter((row) => textAt(row, 0) === form.path)
        .reduce((sum, row) => sum + numberAt(row, 0), 0);
      return {
        label: form.label,
        views,
        submissions: submissions[index],
        rate: views ? (submissions[index] / views) * 100 : null,
      };
    });
    return {
      ...base,
      available: true,
      summary: {
        visitors: numberAt(total, 0),
        uniqueVisitors: numberAt(total, 1),
        pageViews: numberAt(total, 2),
        sessions: numberAt(total, 3),
        newVisitors: numberAt(total, 4),
        returningVisitors: numberAt(total, 5),
        activeRecently: numberAt(
          realtimeReport.rows?.[0] ?? realtimeReport.totals?.[0],
          0,
        ),
      },
      trend: (trendReport.rows ?? [])
        .map((row) => ({
          date: textAt(row, 0),
          visitors: numberAt(row, 0),
          sessions: numberAt(row, 1),
          pageViews: numberAt(row, 2),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topPages: pageRows.map((row) => ({
        path: textAt(row, 0),
        title: textAt(row, 1),
        views: numberAt(row, 0),
        visitors: numberAt(row, 1),
        engagementSeconds: numberAt(row, 2),
      })),
      sources: (sourcesReport.rows ?? []).map((row) => ({
        channel: textAt(row, 0),
        sourceMedium: textAt(row, 1),
        sessions: numberAt(row, 0),
        users: numberAt(row, 1),
      })),
      devices: (devicesReport.rows ?? []).map((row) => ({
        device: textAt(row, 0),
        users: numberAt(row, 0),
        sessions: numberAt(row, 1),
      })),
      geography: (geoReport.rows ?? []).map((row) => ({
        country: textAt(row, 0),
        region: textAt(row, 1),
        users: numberAt(row, 0),
      })),
      conversions,
    };
  } catch (error) {
    console.error("[SGH analytics] reporting unavailable", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown failure",
    });
    return {
      ...base,
      error: "Analytics data is temporarily unavailable.",
      summary: emptySummary,
      trend: [],
      topPages: [],
      sources: [],
      devices: [],
      geography: [],
      conversions: [],
    };
  }
}
