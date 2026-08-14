import { FeedbackCampaignManager } from "@/components/admin/FeedbackCampaignManager";
import { FeedbackQr } from "@/components/admin/FeedbackQr";
import { ConsentMigrationPanel } from "@/components/admin/ConsentMigrationPanel";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";
import { getSmsProvider } from "@/lib/server/sms";
import { hasPermission } from "@/lib/types/admin";
import { smsSchedulingEnabled } from "@/lib/server/sms-scheduler";

export default async function Page() {
  const session = await requireAdmin("feedback_campaigns");
  const provider = getSmsProvider();
  const snapshot = await adminDb.collection("feedback_campaigns").orderBy("createdAt", "desc").limit(50).get();
  const campaigns = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      code: doc.id, name: String(data.name || "Untitled"), source: String(data.source || "other"),
      message: String(data.message || ""), status: String(data.status || "draft"),
      recipientCount: Number(data.recipientCount || 0), queuedCount: Number(data.queuedCount || 0),
      mockedCount: Number(data.mockedCount || 0), acceptedCount: Number(data.acceptedCount || 0),
      deliveredCount: Number(data.deliveredCount || 0), failedCount: Number(data.failedCount || 0),
      unknownCount: Number(data.unknownCount || 0),
      optedOutCount: Number(data.optedOutCount || 0), responseCount: Number(data.responseCount || 0),
      testSmsAccepted: Boolean(data.testSmsAcceptedAt), testLinkOpened: Boolean(data.testLinkOpenedAt),
      testFeedbackSubmitted: Boolean(data.testFeedbackSubmittedAt), testVerified: data.testVerified === true,
      audience: data.audience && typeof data.audience === "object" ? data.audience : undefined,
      scheduledAt: data.scheduledAt?.toDate?.()?.toISOString?.(), scheduledTimezone: String(data.scheduledTimezone || ""), originalEligibleCount: Number(data.originalEligibleCount || 0),
    };
  });
  return <section>
    <p className="text-sm font-semibold text-pink-accent">PATIENT FEEDBACK</p>
    <h1 className="text-3xl font-semibold text-purple-deep">Send Feedback SMS</h1>
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <strong>Automatic test verification</strong>
      <p className="mt-2 text-sm">After the test recipient opens the secure link and submits feedback successfully, bulk sending unlocks automatically.</p>
    </div>
    <FeedbackCampaignManager initialCampaigns={campaigns} canSend={hasPermission(session.role, "feedback_sms")} providerMode={provider.mode} schedulingEnabled={smsSchedulingEnabled()} />
    {session.role === "super_admin" ? <ConsentMigrationPanel /> : null}
    <div className="mt-8"><FeedbackQr /></div>
  </section>;
}
