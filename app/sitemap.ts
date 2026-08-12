import type { MetadataRoute } from "next";
import { HOSPITAL } from "@/lib/constants";
import { services } from "@/data/services";
import { getPublishedArticles, getPublishedDoctors } from "@/lib/server/public-content";

const staticRoutes = ["", "/about", "/services", "/doctors", "/appointments", "/insurance", "/telemedicine", "/screening", "/corporate-wellness", "/patient-resources", "/health", "/gallery", "/contact", "/directions", "/careers", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = HOSPITAL.siteUrl;
  const now = new Date();
  const [doctors, articles] = await Promise.all([getPublishedDoctors(), getPublishedArticles()]);
  return [
    ...staticRoutes.map(route => ({ url: `${base}${route}`, lastModified: now })),
    ...services.map(service => ({ url: `${base}/services/${service.slug}`, lastModified: now })),
    ...doctors.map(doctor => ({ url: `${base}/doctors/${doctor.slug}`, lastModified: now })),
    ...articles.map(article => ({ url: `${base}/health/${article.slug}`, lastModified: new Date(article.date) })),
  ];
}
