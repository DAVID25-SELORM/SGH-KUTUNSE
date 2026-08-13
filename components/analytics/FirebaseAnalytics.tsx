"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { firebaseApp } from "@/lib/firebase";

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

  return null;
}
