import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";

export async function writeAudit(actorUid: string, action: string, entityType: string, entityId: string, metadata: Record<string, string> = {}) {
  await adminDb.collection("audit_logs").add({ actorUid, action, entityType, entityId, metadata, timestamp: FieldValue.serverTimestamp() });
}

