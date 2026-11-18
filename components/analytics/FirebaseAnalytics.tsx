"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { firebaseApp } from "@/lib/firebase";
import { conversionEventForHref, trackEvent } from "@/lib/analytics-events";

export function FirebaseAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    let active = true;

    async function enableAnalytics() {
      if (!firebaseApp) return;
      const { getAnalytics, isSupported } = await import("firebase/analytics");
      if (active && (await isSupported())) {
        getAnalytics(firebaseApp);
      }
    }

    void enableAnalytics();

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link) return;
      const conversion = conversionEventForHref(link.getAttribute("href") ?? "");
      if (conversion) void trackEvent(conversion.name, { ...conversion.params, page_path: window.location.pathname });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
