import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdminRequest } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await verifyAdminRequest("feedback_campaigns");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await context.params;
  const snapshot = await adminDb.collection("feedback_campaigns").doc(id).get();
  if (!snapshot.exists) return NextResponse.json({ ok: false }, { status: 404 });
  let data = snapshot.data()!;
  const leaseUntil = data.processingLeaseUntil?.toDate?.();
  if (data.status === "sending" && leaseUntil instanceof Date && leaseUntil.getTime() <= Date.now()) {
    const recipients = await snapshot.ref.collection("recipients").limit(5_000).get();
    const queued = recipients.docs.filter((doc) => doc.data().status === "queued").length;
    if (queued === 0) {
      const ambiguous = recipients.docs.filter((doc) => doc.data().status === "sending");
      for (let offset = 0; offset < ambiguous.length; offset += 450) { const batch = adminDb.batch(); ambiguous.slice(offset, offset + 450).forEach((doc) => batch.update(doc.ref, { status: "interrupted_delivery_unknown", errorClass: "interrupted_delivery_unknown", updatedAt: FieldValue.serverTimestamp() })); await batch.commit(); }
      const failed = recipients.docs.filter((doc) => doc.data().status === "failed").length;
      const sent = recipients.docs.filter((doc) => ["sent", "accepted", "mocked", "delivered"].includes(String(doc.data().status))).length;
      const finalStatus = sent === 0 && failed && !ambiguous.length ? "failed" : failed || ambiguous.length ? "partially_failed" : "completed";
      await snapshot.ref.update({ status: finalStatus, failedCount: failed, unknownCount: ambiguous.length, queuedCount: 0, processingLeaseUntil: null, updatedAt: FieldValue.serverTimestamp() });
      data = { ...data, status: finalStatus, failedCount: failed, unknownCount: ambiguous.length, queuedCount: 0, processingLeaseUntil: null };
    }
  }
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
    unknownCount: Number(data.unknownCount ?? 0),
    optedOutCount: Number(data.optedOutCount ?? 0),
  });
}
