import "server-only";

import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getAppCheck } from "firebase-admin/app-check";
import { getStorage } from "firebase-admin/storage";

const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const adminApp = getApps()[0] ?? initializeApp({
  credential: applicationDefault(),
  ...(projectId ? { projectId } : {}),
  ...(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? { storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET } : {}),
});

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminAppCheck = getAppCheck(adminApp);
export const adminStorage = getStorage(adminApp);
