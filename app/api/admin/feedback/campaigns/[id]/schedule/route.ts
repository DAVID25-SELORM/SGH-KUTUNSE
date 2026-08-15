import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { campaignAudienceSchema, campaignScheduleSchema } from "@/lib/feedback-campaigns";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { loadCampaignAudience } from "@/lib/server/campaign-audience";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";
import { createScheduledSmsTask, deleteScheduledSmsTask, formatAccraSchedule, smsSchedulingEnabled, validateSmsSchedule } from "@/lib/server/sms-scheduler";
import { getSmsPolicy } from "@/lib/server/sms-settings";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_sms");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  if (!smsSchedulingEnabled()) return NextResponse.json({ ok: false, message: "SMS scheduling is not enabled until the Cloud Tasks queue and service identity are configured." }, { status: 503 });
  const parsed = await parseJson(request, campaignScheduleSchema);
  if (parsed.error) return parsed.error;
  const { id } = await context.params;
  const ref = adminDb.collection("feedback_campaigns").doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return NextResponse.json({ ok: false }, { status: 404 });
  const campaign = snapshot.data()!;

  if (parsed.data.action === "cancel") {
    if (campaign.status !== "scheduled") return NextResponse.json({ ok: false, message: "Only a scheduled campaign can be cancelled." }, { status: 409 });
    const oldTask = String(campaign.scheduledTaskName ?? "");
    await ref.update({ status: "cancelled", scheduleGeneration: FieldValue.increment(1), cancelledAt: FieldValue.serverTimestamp(), cancelledBy: actor.uid, scheduledTaskName: null, updatedAt: FieldValue.serverTimestamp() });
    if (oldTask) await deleteScheduledSmsTask(oldTask);
    await writeAudit(actor.uid, "feedback_campaign.schedule_cancelled", "feedback_campaign", id, { scheduledAt: campaign.scheduledAt?.toDate?.()?.toISOString?.() ?? "unknown" });
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  if (campaign.testVerified !== true || !["test_verified", "scheduled", "cancelled"].includes(String(campaign.status))) return NextResponse.json({ ok: false, message: "Complete and verify the test before scheduling." }, { status: 409 });
  const policy = await getSmsPolicy();
  const validation = validateSmsSchedule(parsed.data.date, parsed.data.time, policy);
  if (!validation.ok) return NextResponse.json({ ok: false, message: validation.message }, { status: 400 });
  const audience = campaignAudienceSchema.safeParse(campaign.audience);
  if (!audience.success) return NextResponse.json({ ok: false, message: "This campaign does not have a valid saved audience." }, { status: 409 });
  const { summary } = await loadCampaignAudience(audience.data);
  if (!summary.eligible) return NextResponse.json({ ok: false, message: "No eligible recipients remain. Review the audience exclusions before scheduling." }, { status: 409 });
  const generation = Number(campaign.scheduleGeneration ?? 0) + 1;
  const oldTask = String(campaign.scheduledTaskName ?? "");
  const name = await createScheduledSmsTask(id, generation, validation.value);
  try {
    await ref.update({ status: "scheduled", scheduleGeneration: generation, scheduledAt: Timestamp.fromDate(validation.value), scheduledTimezone: "Africa/Accra", scheduledBy: actor.uid, scheduledByName: String(actor.name || actor.email || "Administrator"), scheduledTaskName: name, originalEligibleCount: summary.eligible, ...(campaign.scheduleCreatedAt ? {} : { scheduleCreatedAt: FieldValue.serverTimestamp() }), scheduleUpdatedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  } catch (error) { await deleteScheduledSmsTask(name); throw error; }
  if (oldTask && oldTask !== name) await deleteScheduledSmsTask(oldTask);
  const event = parsed.data.action === "reschedule" || campaign.status === "scheduled" ? "feedback_campaign.rescheduled" : "feedback_campaign.scheduled";
  await writeAudit(actor.uid, event, "feedback_campaign", id, { eligibleCount: String(summary.eligible), scheduledAt: validation.value.toISOString(), timezone: "Africa/Accra" });
  return NextResponse.json({ ok: true, status: "scheduled", scheduledAt: validation.value.toISOString(), scheduledLabel: formatAccraSchedule(validation.value), eligibleCount: summary.eligible, generation });
}
