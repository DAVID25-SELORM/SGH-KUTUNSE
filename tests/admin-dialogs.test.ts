import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const adminComponents = [
  "FeedbackCampaignManager.tsx",
  "ContactEditor.tsx",
  "GalleryAlbumEditor.tsx",
]
  .map((file) => readFileSync(join(root, "components", "admin", file), "utf8"))
  .join("\n");
const modal = readFileSync(
  join(root, "components", "admin", "ConfirmModal.tsx"),
  "utf8",
);

describe("SGH operational confirmations", () => {
  it("does not use browser-native dialogs", () => {
    expect(adminComponents).not.toMatch(
      /\b(?:window\.)?(?:confirm|alert|prompt)\s*\(/,
    );
  });

  it("provides an accessible shared modal with safe processing behavior", () => {
    expect(modal).toContain('role="dialog"');
    expect(modal).toContain('aria-modal="true"');
    expect(modal).toContain('event.key === "Escape"');
    expect(modal).toContain('event.key !== "Tab"');
    expect(modal).toContain("previousFocus.current?.focus()");
    expect(modal).toContain("processing || disabled");
  });
});
