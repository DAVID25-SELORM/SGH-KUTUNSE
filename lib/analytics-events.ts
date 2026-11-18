"use client";

import { firebaseApp } from "@/lib/firebase";

type EventParams = Record<string, string | number | boolean>;

/** Sends a GA4 event. Silently does nothing when analytics is unavailable (no config, blocked, or admin area). */
export async function trackEvent(name: string, params: EventParams = {}) {
  try {
    if (!firebaseApp || typeof window === "undefined" || window.location.pathname.startsWith("/admin")) return;
    const { getAnalytics, isSupported, logEvent } = await import("firebase/analytics");
    if (await isSupported()) logEvent(getAnalytics(firebaseApp), name, params);
  } catch {
    /* analytics must never break the page */
  }
}

/** Maps a clicked link to a GA4 conversion event name, or null if it is not one we track. */
export function conversionEventForHref(href: string): { name: string; params: EventParams } | null {
  if (/^https:\/\/wa\.me\//i.test(href)) return { name: "click_whatsapp", params: {} };
  if (href.startsWith("tel:")) return { name: "click_call", params: { phone: href.slice(4) } };
  if (/^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(href) || href === "/directions" || href.startsWith("/directions?"))
    return { name: "click_directions", params: {} };
  return null;
}
