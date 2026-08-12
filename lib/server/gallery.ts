import "server-only";
import { cache } from "react";
import { adminDb } from "./firebase-admin";
import type { GalleryAlbum } from "@/lib/gallery";

const fallback: GalleryAlbum = {
  id: "programs-and-community",
  title: "Programs & Community",
  slug: "programs-and-community",
  category: "Programs & Community",
  shortDescription: "Photographs from Satellite General Hospital programs and community activities. Event details are awaiting hospital verification.",
  fullDescription: "",
  eventDate: "",
  location: "",
  coverImageId: "program-01",
  images: Array.from({ length: 8 }, (_, index) => ({ id: `program-${String(index + 1).padStart(2, "0")}`, url: `/images/gallery/program-${String(index + 1).padStart(2, "0")}.jpg`, alt: `Satellite General Hospital program activity ${index + 1}`, caption: "", order: index })),
  displayOrder: 0,
  featured: true,
  status: "published",
};

function serialize(id: string, data: FirebaseFirestore.DocumentData): GalleryAlbum {
  return { id, title: String(data.title), slug: String(data.slug), category: String(data.category), shortDescription: String(data.shortDescription ?? ""), fullDescription: String(data.fullDescription ?? ""), eventDate: String(data.eventDate ?? ""), location: String(data.location ?? ""), coverImageId: String(data.coverImageId ?? ""), images: Array.isArray(data.images) ? data.images : [], displayOrder: Number(data.displayOrder ?? 0), featured: data.featured === true, status: data.status, publishedAt: data.publishedAt?.toDate?.().toISOString() };
}
export const getPublishedGalleryAlbums = cache(async (): Promise<GalleryAlbum[]> => { try { const snapshot = await adminDb.collection("gallery_albums").where("status", "==", "published").orderBy("displayOrder", "asc").get(); return snapshot.empty ? [fallback] : snapshot.docs.map(doc => serialize(doc.id, doc.data())); } catch { return [fallback]; } });
export const getPublishedGalleryAlbum = cache(async (slug: string) => (await getPublishedGalleryAlbums()).find(album => album.slug === slug));
