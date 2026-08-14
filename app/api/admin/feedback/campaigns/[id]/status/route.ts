import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await verifyAdminRequest("feedback_campaigns");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await context.params;
  const snapshot = await adminDb.collection("feedback_campaigns").doc(id).get();
  if (!snapshot.exists) return NextResponse.json({ ok: false }, { status: 404 });
  const data = snapshot.data()!;
  return NextResponse.json({
    ok: true,
    status: String(data.status ?? "draft"),
    testSmsAccepted: Boolean(data.testSmsAcceptedAt),
    testLinkOpened: Boolean(data.testLinkOpenedAt),
    testFeedbackSubmitted: Boolean(data.testFeedbackSubmittedAt),
    testVerified: data.testVerified === true,
    recipientCount: Number(data.recipientCount ?? 0),
    queuedCount: Number(data.queuedCount ?? 0),
    acceptedCount: Number(data.acceptedCount ?? 0),
    deliveredCount: Number(data.deliveredCount ?? 0),
    failedCount: Number(data.failedCount ?? 0),
    optedOutCount: Number(data.optedOutCount ?? 0),
  });
}
