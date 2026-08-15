import { describe, expect, it } from "vitest";
import { calculateDashboardStats, dashboardWindows } from "@/lib/dashboard-stats";
import { buildSubmissionSearchTerms, paginateSubmissionRows, submissionMatchesSearch } from "@/lib/submission-search";

describe("admin data integrity", () => {
  it("indexes generated references with ordinary form terms", () => {
    const terms = buildSubmissionSearchTerms({ reference: "SGH-APT-ABC123", fullName: "QA Test Patient", phone: "+233535694212" });
    expect(terms).toEqual(expect.arrayContaining(["sgh-apt-abc123", "qa", "test", "patient", "+233535694212"]));
  });

  it("finds legacy references and nested feedback values without stored search terms", () => {
    const legacy = { reference: "SGH-FBK-LEGACY1", contactPhone: "+233535694212", receiptDetails: { unit: "Laboratory" } };
    expect(submissionMatchesSearch(legacy, "SGH-FBK-LEGACY1")).toBe(true);
    expect(submissionMatchesSearch(legacy, "laboratory")).toBe(true);
    expect(submissionMatchesSearch(legacy, "missing")).toBe(false);
  });

  it("filters the full inbox dataset before pagination and preserves cursor order", () => {
    const rows = Array.from({ length: 30 }, (_, index) => ({ id: `id-${index}`, fullName: index >= 22 ? "target patient" : "ordinary patient" }));
    const first = paginateSubmissionRows(rows, "target", undefined, 5);
    expect(first.matchingCount).toBe(8);
    expect(first.page.map(row => row.id)).toEqual(["id-22", "id-23", "id-24", "id-25", "id-26"]);
    expect(first.nextCursor).toBe("id-26");
    expect(paginateSubmissionRows(rows, "target", first.nextCursor ?? undefined, 5).page.map(row => row.id)).toEqual(["id-27", "id-28", "id-29"]);
  });

  it("uses Ghana calendar-day and consistent workflow count semantics", () => {
    const now = new Date("2026-08-15T04:30:00Z");
    expect(dashboardWindows(now)).toEqual({ today: new Date("2026-08-15T00:00:00Z"), week: new Date("2026-08-09T00:00:00Z") });
    expect(calculateDashboardStats([
      { status: "new", createdAt: new Date("2026-08-15T00:00:00Z") },
      { status: "in_review", createdAt: new Date("2026-08-10T01:00:00Z") },
      { status: "completed", createdAt: new Date("2026-08-08T23:59:59Z") },
    ], now, 48)).toEqual({ count: 1, today: 1, week: 2, overdue: 1 });
  });
});
