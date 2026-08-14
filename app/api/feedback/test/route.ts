import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { token?: string } | null;
  const token = body?.token?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{32,160}$/.test(token)) return NextResponse.json({ ok: false }, { status: 400 });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const tokenRef = adminDb.collection("feedback_test_tokens").doc(tokenHash);
  const opened = await adminDb.runTransaction(async (transaction) => {
    const tokenSnapshot = await transaction.get(tokenRef);
    if (!tokenSnapshot.exists || tokenSnapshot.data()?.used === true) return false;
    const expiresAt = tokenSnapshot.data()?.expiresAt?.toDate?.();
    if (!(expiresAt instanceof Date) || expiresAt.getTime() <= Date.now()) return false;
    const campaignRef = adminDb.collection("feedback_campaigns").doc(String(tokenSnapshot.data()?.campaignId));
    const campaignSnapshot = await transaction.get(campaignRef);
    if (!campaignSnapshot.exists) return false;
    transaction.set(tokenRef, { openedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.update(campaignRef, { status: "test_link_opened", testLinkOpenedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return true;
  });
  return NextResponse.json({ ok: opened });
}
