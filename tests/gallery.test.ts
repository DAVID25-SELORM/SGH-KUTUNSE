import { describe, expect, it } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { galleryAlbumSchema, validateGalleryPublishing } from "@/lib/gallery";
const draft = {
  title: "Verified title",
  slug: "verified-title",
  category: "Community",
  shortDescription: "",
  fullDescription: "",
  eventDate: "",
  location: "",
  coverImageId: "",
  images: [],
  displayOrder: 0,
  featured: false,
  status: "draft" as const,
};
describe("gallery publishing", () => {
  it("allows incomplete drafts", () =>
    expect(validateGalleryPublishing(draft)).toBeNull());
  it("blocks publishing without images", () =>
    expect(
      validateGalleryPublishing({ ...draft, status: "published" }),
    ).toMatch(/image/));
  it("blocks missing alt text", () => {
    const album = galleryAlbumSchema.parse({
      ...draft,
      status: "published",
      coverImageId: "one",
      images: [
        {
          id: "one",
          url: "/one.jpg",
          storagePath: "",
          alt: "",
          caption: "",
          order: 0,
        },
      ],
    });
    expect(validateGalleryPublishing(album)).toMatch(/alt text/);
  });
  it("accepts valid published album", () => {
    const album = galleryAlbumSchema.parse({
      ...draft,
      status: "published",
      coverImageId: "one",
      images: [
        {
          id: "one",
          url: "/one.jpg",
          storagePath: "",
          alt: "Program activity",
          caption: "",
          order: 0,
        },
      ],
    });
    expect(validateGalleryPublishing(album)).toBeNull();
  });
});

describe("taxi rank health-screening gallery", () => {
  it("contains all 44 unique optimized photographs", () => {
    const directory = join(
      process.cwd(),
      "public",
      "images",
      "gallery",
      "taxi-rank-health-screening",
    );
    const images = readdirSync(directory).filter((name) =>
      name.endsWith(".webp"),
    );
    expect(images).toHaveLength(44);
    expect(
      images.every((name) => statSync(join(directory, name)).size < 500_000),
    ).toBe(true);
  });
});
