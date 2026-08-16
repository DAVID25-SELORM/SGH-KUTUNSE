import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/types/admin";

describe("website analytics administration", () => {
  it("grants aggregate analytics only to the approved roles", () => {
    expect(hasPermission("super_admin", "analytics_view")).toBe(true);
    expect(hasPermission("admin", "analytics_view")).toBe(true);
    expect(hasPermission("viewer", "analytics_view")).toBe(true);
    expect(hasPermission("reception", "analytics_view")).toBe(false);
    expect(hasPermission("insurance", "analytics_view")).toBe(false);
    expect(hasPermission("corporate", "analytics_view")).toBe(false);
    expect(hasPermission("content_editor", "analytics_view")).toBe(false);
  });

  it("keeps credentials server-side and avoids sensitive analytics fields", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/server/website-analytics.ts"),
      "utf8",
    );
    expect(source).toContain('import "server-only"');
    expect(source).not.toMatch(/phone|email|patientName|memberId|ipAddress/i);
    expect(source).not.toContain("NEXT_PUBLIC_GA4_PROPERTY_ID");
  });

  it("does not add a second manual page-view emitter", () => {
    const tracker = readFileSync(
      join(process.cwd(), "components/analytics/FirebaseAnalytics.tsx"),
      "utf8",
    );
    expect(tracker).not.toMatch(/logEvent\([^)]*["']page_view/);
  });

  it("connects App Hosting to the existing Firebase-linked GA4 property", () => {
    const hosting = readFileSync(
      join(process.cwd(), "apphosting.yaml"),
      "utf8",
    );
    expect(hosting).toContain("GA4_PROPERTY_ID");
    expect(hosting).toContain('value: "549140369"');
  });

  it("shows unavailable data rather than fabricated zero traffic", () => {
    const page = readFileSync(
      join(process.cwd(), "app/admin/(secure)/analytics/page.tsx"),
      "utf8",
    );
    expect(page).toContain("Analytics data is temporarily unavailable.");
    expect(page).toContain('requireAdmin("analytics_view")');
  });

  it("bounds report latency and reuses one GA access token", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/server/website-analytics.ts"),
      "utf8",
    );
    expect(source).toContain("AbortSignal.timeout(DATA_API_TIMEOUT_MS)");
    expect(source).toContain("Analytics report timed out");
    expect(source).toContain("const token = await accessToken()");
    expect(source).toContain("Authorization: `Bearer ${token}`");
  });
});
