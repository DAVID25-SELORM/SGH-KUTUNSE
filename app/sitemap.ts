import type { MetadataRoute } from "next";
import { HOSPITAL } from "@/lib/constants";
import { services } from "@/data/services";
import { getPublishedArticles, getPublishedDoctors } from "@/lib/server/public-content";
import { getPublishedGalleryAlbums } from "@/lib/server/gallery";

const staticRoutes = ["", "/about", "/services", "/doctors", "/appointments", "/insurance", "/corporate-wellness", "/patient-resources", "/health", "/gallery", "/feedback", "/contact", "/directions", "/telemedicine", "/screening", "/careers", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = HOSPITAL.siteUrl;
  const [doctors, articles, albums] = await Promise.all([getPublishedDoctors(), getPublishedArticles(), getPublishedGalleryAlbums()]);
  return [
    // No lastModified for pages without a real modification date: a value that changes on every request is a false freshness signal.
    // /services/telemedicine and /services/health-screening are omitted: they redirect to /telemedicine and /screening.
    ...staticRoutes.filter(route => route !== "/health" || articles.length > 0).map(route => ({ url: `${base}${route}` })),
    ...services.filter(service => !["telemedicine", "health-screening"].includes(service.slug)).map(service => ({ url: `${base}/services/${service.slug}` })),
    ...doctors.map(doctor => ({ url: `${base}/doctors/${doctor.slug}` })),
    ...articles.map(article => ({ url: `${base}/health/${article.slug}`, lastModified: new Date(article.date) })),
    ...albums.map(album => ({ url: `${base}/gallery/${album.slug}`, ...(album.publishedAt ? { lastModified: new Date(album.publishedAt) } : {}) })),
  ];
}
