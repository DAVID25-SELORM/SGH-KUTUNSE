import { FeedbackCampaignManager } from "@/components/admin/FeedbackCampaignManager";
import { FeedbackQr } from "@/components/admin/FeedbackQr";
import { ConsentMigrationPanel } from "@/components/admin/ConsentMigrationPanel";
import { requireAdmin } from "@/lib/server/auth";
import { adminDb } from "@/lib/server/firebase-admin";
import { getSmsProvider } from "@/lib/server/sms";
import { hasPermission } from "@/lib/types/admin";
import { smsSchedulingEnabled } from "@/lib/server/sms-scheduler";
import { getSmsPolicy } from "@/lib/server/sms-settings";
import { campaignPurposes, type CampaignPurpose } from "@/lib/sms-message";

export default async function Page() {
  const session = await requireAdmin("feedback_campaigns");
  const provider = getSmsProvider();
  const [snapshot, smsPolicy] = await Promise.all([adminDb.collection("feedback_campaigns").orderBy("createdAt", "desc").limit(50).get(), getSmsPolicy()]);
  const campaigns = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      code: doc.id, name: String(data.name || "Untitled"), source: String(data.source || "other"),
      message: String(data.message || ""), status: String(data.status || "draft"),
      purpose: (campaignPurposes.includes(data.purpose as CampaignPurpose) ? data.purpose : "feedback_request") as CampaignPurpose, templateId: String(data.templateId || "patient_feedback"), messageMode: (data.messageMode === "custom" ? "custom" : "template") as "custom" | "template", messageHash: String(data.messageHash || ""), testedMessageHash: String(data.testedMessageHash || ""),
      recipientCount: Number(data.recipientCount || 0), queuedCount: Number(data.queuedCount || 0),
      mockedCount: Number(data.mockedCount || 0), acceptedCount: Number(data.acceptedCount || 0),
      deliveredCount: Number(data.deliveredCount || 0), failedCount: Number(data.failedCount || 0),
      unknownCount: Number(data.unknownCount || 0),
      optedOutCount: Number(data.optedOutCount || 0), responseCount: Number(data.responseCount || 0),
      testSmsAccepted: Boolean(data.testSmsAcceptedAt), testLinkOpened: Boolean(data.testLinkOpenedAt),
      testFeedbackSubmitted: Boolean(data.testFeedbackSubmittedAt), testVerified: data.testVerified === true,
      testSendState: String(data.testSendState || ""),
      audience: data.audience && typeof data.audience === "object" ? data.audience : undefined,
      scheduledAt: data.scheduledAt?.toDate?.()?.toISOString?.(), scheduledTimezone: String(data.scheduledTimezone || ""), scheduledByName: String(data.scheduledByName || ""), originalEligibleCount: Number(data.originalEligibleCount || 0),
    };
  });
  return <section>
    <p className="text-sm font-semibold text-pink-accent">SECURE MESSAGING</p>
    <h1 className="text-3xl font-semibold text-purple-deep">SMS Campaigns</h1>
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
      <strong>Purpose-aware test verification</strong>
      <p className="mt-2 text-sm">Feedback requests unlock only after secure feedback submission. Approved non-feedback messages unlock after the provider accepts the exact tested message.</p>
    </div>
    <FeedbackCampaignManager initialCampaigns={campaigns} canSend={hasPermission(session.roles, "feedback_sms")} providerMode={provider.mode} schedulingEnabled={smsSchedulingEnabled()} initialSmsPolicy={smsPolicy} />
    {session.roles.includes("super_admin") ? <ConsentMigrationPanel /> : null}
    <div className="mt-8"><FeedbackQr /></div>
  </section>;
}
