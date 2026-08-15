import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Firestore index configuration", () => {
  it("supports contact campaign-history lookups by recipient phone hash", () => {
    const config = JSON.parse(readFileSync("firestore.indexes.json", "utf8")) as {
      fieldOverrides?: Array<{
        collectionGroup?: string;
        fieldPath?: string;
        indexes?: Array<{ order?: string; queryScope?: string }>;
      }>;
    };

    expect(config.fieldOverrides).toEqual(expect.arrayContaining([
      expect.objectContaining({
        collectionGroup: "recipients",
        fieldPath: "phoneHash",
        indexes: expect.arrayContaining([
          { order: "ASCENDING", queryScope: "COLLECTION_GROUP" },
        ]),
      }),
    ]));
  });
});
