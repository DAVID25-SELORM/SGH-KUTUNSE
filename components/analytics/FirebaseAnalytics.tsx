"use client";

import { useEffect } from "react";
import { firebaseApp } from "@/lib/firebase";

export function FirebaseAnalytics() {
  useEffect(() => {
    let active = true;

    async function enableAnalytics() {
      if (!firebaseApp) return;
      const { initializeAnalytics, isSupported } = await import("firebase/analytics");
      if (active && (await isSupported())) {
        initializeAnalytics(firebaseApp, {
          config: {
            cookie_domain: window.location.hostname,
            cookie_flags: "SameSite=Lax;Secure",
          },
        });
      }
    }

    void enableAnalytics();

    return () => {
      active = false;
    };
  }, []);

  return null;
}
