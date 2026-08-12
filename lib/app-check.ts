"use client";
import { getToken, initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { firebaseApp } from "./firebase";
let initialized = false;
let appCheck: AppCheck | null = null;
export async function appCheckHeaders(): Promise<Record<string, string>> {
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
  if (!firebaseApp || !siteKey) return {};
  if (!initialized) { appCheck = initializeAppCheck(firebaseApp, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true }); initialized = true; }
  const token = await getToken(appCheck!);
  return { "X-Firebase-AppCheck": token.token };
}
