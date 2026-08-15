import { z } from "@/lib/zod";

export const galleryStatuses = ["draft", "published", "archived"] as const;
export const galleryImageSchema = z.strictObject({
  id: z.string().trim().min(1).max(128),
  url: z.string().trim().min(1).max(1000),
  storagePath: z.string().trim().max(500).optional().or(z.literal("")),
  alt: z.string().trim().max(200),
  caption: z.string().trim().max(500).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).max(1000),
});
export const galleryAlbumSchema = z.strictObject({
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().toLowerCase().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.string().trim().min(2).max(100),
  shortDescription: z.string().trim().max(500).optional().or(z.literal("")),
  fullDescription: z.string().trim().max(5000).optional().or(z.literal("")),
  eventDate: z.string().trim().max(40).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  coverImageId: z.string().trim().max(128).optional().or(z.literal("")),
  images: z.array(galleryImageSchema).max(100),
  displayOrder: z.coerce.number().int().min(0).max(10000),
  featured: z.boolean(),
  status: z.enum(galleryStatuses),
});
export type GalleryAlbumInput = z.infer<typeof galleryAlbumSchema>;
export type GalleryAlbum = GalleryAlbumInput & { id: string; publishedAt?: string };

export function validateGalleryPublishing(album: GalleryAlbumInput) {
  if (album.status !== "published") return null;
  if (!album.images.length) return "A published album requires at least one image.";
  if (!album.coverImageId || !album.images.some(image => image.id === album.coverImageId)) return "Select a valid cover image before publishing.";
  if (album.images.some(image => !image.alt.trim())) return "Every published image requires meaningful alt text.";
  return null;
}
