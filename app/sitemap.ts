import type { MetadataRoute } from "next";
import { HOSPITAL } from "@/lib/constants";
import { services } from "@/data/services";
import { doctors } from "@/data/doctors";
import { articles } from "@/data/articles";

const staticRoutes = [
  "",
  "/about",
  "/services",
  "/doctors",
  "/appointments",
  "/insurance",
  "/telemedicine",
  "/screening",
  "/corporate-wellness",
  "/patient-resources",
  "/health",
  "/contact",
  "/directions",
  "/careers",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = HOSPITAL.siteUrl;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
  }));

  for (const service of services) {
    entries.push({ url: `${base}/services/${service.slug}`, lastModified: now });
  }
  for (const doctor of doctors) {
    entries.push({ url: `${base}/doctors/${doctor.slug}`, lastModified: now });
  }
  for (const article of articles) {
    entries.push({ url: `${base}/health/${article.slug}`, lastModified: new Date(article.date) });
  }

  return entries;
}
