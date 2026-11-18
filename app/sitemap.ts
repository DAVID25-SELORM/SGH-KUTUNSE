import type { MetadataRoute } from "next";
import { HOSPITAL } from "@/lib/constants";
import { services } from "@/data/services";
import { getPublishedArticles, getPublishedDoctors } from "@/lib/server/public-content";
import { getPublishedGalleryAlbums } from "@/lib/server/gallery";

const staticRoutes = ["", "/about", "/services", "/doctors", "/appointments", "/insurance", "/corporate-wellness", "/patient-resources", "/health", "/gallery", "/feedback", "/contact", "/directions", "/careers", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = HOSPITAL.siteUrl;
  const [doctors, articles, albums] = await Promise.all([getPublishedDoctors(), getPublishedArticles(), getPublishedGalleryAlbums()]);
  return [
    // No lastModified for pages without a real modification date: a value that changes on every request is a false freshness signal.
    // /telemedicine and /screening are intentionally omitted: their canonical is the matching /services/... page.
    ...staticRoutes.filter(route => route !== "/health" || articles.length > 0).map(route => ({ url: `${base}${route}` })),
    ...services.map(service => ({ url: `${base}/services/${service.slug}` })),
    ...doctors.map(doctor => ({ url: `${base}/doctors/${doctor.slug}` })),
    ...articles.map(article => ({ url: `${base}/health/${article.slug}`, lastModified: new Date(article.date) })),
    ...albums.map(album => ({ url: `${base}/gallery/${album.slug}`, ...(album.publishedAt ? { lastModified: new Date(album.publishedAt) } : {}) })),
  ];
}
