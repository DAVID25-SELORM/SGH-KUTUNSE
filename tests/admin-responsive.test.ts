import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const component = (name: string) =>
  readFileSync(join(process.cwd(), "components", "admin", name), "utf8");

describe("admin mobile responsiveness", () => {
  it("keeps the notification panel and toast inside narrow viewports", () => {
    const notifications = component("AdminNotifications.tsx");
    expect(notifications).toContain("fixed inset-x-3 top-[4.5rem]");
    expect(notifications).toContain("max-h-[calc(100dvh-5.25rem)]");
    expect(notifications).toContain("sm:absolute sm:inset-x-auto sm:right-0");
    expect(notifications).toContain("fixed inset-x-3 bottom-3");
    expect(notifications).toContain('aria-label="Close notifications"');
  });

  it("prevents the shared admin shell from widening the phone viewport", () => {
    const shell = component("AdminShell.tsx");
    expect(shell).toContain("min-h-screen overflow-x-hidden");
    expect(shell).toContain("min-w-0 overflow-x-hidden p-3");
    expect(shell).toContain("hidden min-w-0 min-[390px]:block");
  });

  it("stacks notification-history actions on narrow screens", () => {
    const history = component("AdminNotificationHistory.tsx");
    expect(history).toContain("flex flex-col gap-3 sm:flex-row");
    expect(history).toContain("grid gap-2 min-[420px]:grid-cols-2");
    expect(history).toContain("break-all text-sm");
  });
});
