export type DashboardRecord = { status?: unknown; createdAt?: unknown };

export function dateFromRecord(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate() as Date;
  if (value instanceof Date) return value;
  return null;
}

export function dashboardWindows(now = new Date()) {
  // Africa/Accra is GMT year-round; use explicit UTC calendar boundaries.
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const week = new Date(today); week.setUTCDate(week.getUTCDate() - 6);
  return { today, week };
}

export function calculateDashboardStats(records: DashboardRecord[], now = new Date(), followUpHours = 48) {
  const { today, week } = dashboardWindows(now);
  const overdue = new Date(now.getTime() - Math.max(1, followUpHours) * 3_600_000);
  let count = 0, todayCount = 0, weekCount = 0, overdueCount = 0;
  for (const record of records) {
    const status = String(record.status ?? "");
    const createdAt = dateFromRecord(record.createdAt);
    if (status === "new") count++;
    if (createdAt && createdAt >= today) todayCount++;
    if (createdAt && createdAt >= week) weekCount++;
    if (createdAt && createdAt <= overdue && ["new", "in_review"].includes(status)) overdueCount++;
  }
  return { count, today: todayCount, week: weekCount, overdue: overdueCount };
}
