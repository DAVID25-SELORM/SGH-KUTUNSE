import "server-only";
import type { Transaction } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";
import { notificationCopy, notificationTarget } from "@/lib/notifications";
import type { SubmissionKind } from "@/lib/types/submissions";

export function createSubmissionNotification(transaction: Transaction, kind: SubmissionKind, documentId: string, reference: string, createdAt: unknown, priority: "normal" | "important" = "normal") {
  const copy = notificationCopy[kind];
  transaction.create(adminDb.collection("admin_notifications").doc(`${kind}_${documentId}`), {
    type: kind, title: copy.title, body: copy.body, reference, targetUrl: notificationTarget(kind, documentId),
    priority, sourceDocumentId: documentId, createdAt,
  });
}
