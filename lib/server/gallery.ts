import "server-only";
import { cache } from "react";
import { adminDb } from "./firebase-admin";
import type { GalleryAlbum } from "@/lib/gallery";

const fallback: GalleryAlbum = {
  id: "programs-and-community",
  title: "Programs & Community",
  slug: "programs-and-community",
  category: "Programs & Community",
  shortDescription:
    "Photographs from Satellite General Hospital programs and community activities.",
  fullDescription: "",
  eventDate: "",
  location: "",
  coverImageId: "program-01",
  images: Array.from({ length: 8 }, (_, index) => ({
    id: `program-${String(index + 1).padStart(2, "0")}`,
    url: `/images/gallery/program-${String(index + 1).padStart(2, "0")}.jpg`,
    alt: `Satellite General Hospital program activity ${index + 1}`,
    caption: "",
    order: index,
  })),
  displayOrder: 0,
  featured: true,
  status: "published",
};

const taxiRankHealthScreening: GalleryAlbum = {
  id: "taxi-rank-health-screening",
  title: "Free Health Screening at the Taxi Rank, Satellite Bus Stop",
  slug: "free-health-screening-taxi-rank-satellite-bus-stop",
  category: "Community Outreach",
  shortDescription:
    "Highlights from Satellite General Hospital's free community health screening at the Taxi Rank, Satellite Bus Stop.",
  fullDescription:
    "Satellite General Hospital brought free health screening services closer to the community at the Taxi Rank, Satellite Bus Stop. These photographs capture the hospital team welcoming participants and providing essential screening support.",
  eventDate: "",
  location: "Taxi Rank, Satellite Bus Stop",
  coverImageId: "taxi-rank-screening-01",
  images: Array.from({ length: 44 }, (_, index) => ({
    id: `taxi-rank-screening-${String(index + 1).padStart(2, "0")}`,
    url: `/images/gallery/taxi-rank-health-screening/screening-${String(index + 1).padStart(2, "0")}.webp`,
    alt: `Satellite General Hospital free health screening at the Taxi Rank, Satellite Bus Stop, photo ${index + 1}`,
    caption: "",
    order: index,
  })),
  displayOrder: 1,
  featured: true,
  status: "published",
};

function includeStaticAlbums(albums: GalleryAlbum[]) {
  return albums.some((album) => album.slug === taxiRankHealthScreening.slug)
    ? albums
    : [...albums, taxiRankHealthScreening].sort(
        (left, right) => left.displayOrder - right.displayOrder,
      );
}

function serialize(
  id: string,
  data: FirebaseFirestore.DocumentData,
): GalleryAlbum {
  return {
    id,
    title: String(data.title),
    slug: String(data.slug),
    category: String(data.category),
    shortDescription: String(data.shortDescription ?? ""),
    fullDescription: String(data.fullDescription ?? ""),
    eventDate: String(data.eventDate ?? ""),
    location: String(data.location ?? ""),
    coverImageId: String(data.coverImageId ?? ""),
    images: Array.isArray(data.images) ? data.images : [],
    displayOrder: Number(data.displayOrder ?? 0),
    featured: data.featured === true,
    status: data.status,
    publishedAt: data.publishedAt?.toDate?.().toISOString(),
  };
}
export const getPublishedGalleryAlbums = cache(
  async (): Promise<GalleryAlbum[]> => {
    try {
      const snapshot = await adminDb
        .collection("gallery_albums")
        .where("status", "==", "published")
        .orderBy("displayOrder", "asc")
        .get();
      return includeStaticAlbums(
        snapshot.empty
          ? [fallback]
          : snapshot.docs.map((doc) => serialize(doc.id, doc.data())),
      );
    } catch {
      return includeStaticAlbums([fallback]);
    }
  },
);
export const getPublishedGalleryAlbum = cache(async (slug: string) =>
  (await getPublishedGalleryAlbums()).find((album) => album.slug === slug),
);
