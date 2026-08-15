import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { counterDelta, resolveDeliveryTransition } from "@/lib/sms-delivery";
import { verifyAdminRequest } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { adminDb } from "@/lib/server/firebase-admin";
import { isTrustedOrigin } from "@/lib/server/origin";
import { getSmsProvider } from "@/lib/server/sms";

export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isTrustedOrigin(request))
    return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_sms");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const provider = getSmsProvider();
  if (provider.mode !== "live" || !provider.getDeliveryReports)
    return NextResponse.json(
      {
        ok: false,
        message: "Delivery reconciliation requires the live Arkesel provider.",
      },
      { status: 409 },
    );

  const { id } = await context.params;
  const campaignRef = adminDb.collection("feedback_campaigns").doc(id);
  if (!(await campaignRef.get()).exists)
    return NextResponse.json({ ok: false }, { status: 404 });
  const snapshot = await campaignRef
    .collection("recipients")
    .limit(5_001)
    .get();
  if (snapshot.size > 5_000)
    return NextResponse.json(
      { ok: false, message: "Campaign recipient limit exceeded." },
      { status: 413 },
    );
  const candidates = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return (
      typeof data.providerId === "string" &&
      data.providerId &&
      ["sent", "failed", "interrupted_delivery_unknown"].includes(
        String(data.status),
      )
    );
  });

  let updated = 0;
  const transitionCounts: Record<string, number> = {};
  for (let offset = 0; offset < candidates.length; offset += 1_000) {
    const group = candidates.slice(offset, offset + 1_000);
    let reports;
    try {
      reports = await provider.getDeliveryReports(
        group.map((doc) => String(doc.data().providerId)),
      );
    } catch (error) {
      console.warn("[SGH SMS] delivery reconciliation unavailable", {
        campaignId: id,
        checkedCount: group.length,
        reason: error instanceof Error ? error.name : "unknown_error",
      });
      return NextResponse.json(
        {
          ok: false,
          message:
            "Arkesel delivery reports are temporarily unavailable. The SMS will not be resent; please try checking its delivery status again shortly.",
        },
        { status: 503 },
      );
    }
    const reportsById = new Map(
      reports.map((report) => [report.providerId, report.status]),
    );
    for (let chunkOffset = 0; chunkOffset < group.length; chunkOffset += 100) {
      const chunk = group.slice(chunkOffset, chunkOffset + 100);
      const changes = await adminDb.runTransaction(async (transaction) => {
        const freshDocs = await transaction.getAll(
          ...chunk.map((doc) => doc.ref),
        );
        const deltas = {
          acceptedCount: 0,
          deliveredCount: 0,
          failedCount: 0,
          unknownCount: 0,
        };
        const localChanges: string[] = [];
        for (const fresh of freshDocs) {
          const data = fresh.data();
          const providerStatus = reportsById.get(String(data?.providerId));
          if (!providerStatus) continue;
          const transition = resolveDeliveryTransition(
            String(data?.status),
            providerStatus,
          );
          if (!transition) continue;
          const delta = counterDelta(String(data?.status), transition.status);
          Object.keys(deltas).forEach((key) => {
            deltas[key as keyof typeof deltas] +=
              delta[key as keyof typeof delta];
          });
          transaction.update(fresh.ref, {
            ...transition,
            providerCheckedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          const transitionKey = `${String(data?.status)}->${transition.status}`;
          localChanges.push(transitionKey);
        }
        if (Object.values(deltas).some(Boolean))
          transaction.update(campaignRef, {
            ...Object.fromEntries(
              Object.entries(deltas)
                .filter(([, value]) => value)
                .map(([key, value]) => [key, FieldValue.increment(value)]),
            ),
            deliveryReconciledAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        return localChanges;
      });
      updated += changes.length;
      changes.forEach((key) => {
        transitionCounts[key] = (transitionCounts[key] ?? 0) + 1;
      });
    }
  }
  await writeAudit(
    actor.uid,
    "feedback_campaign.delivery_reconciled",
    "feedback_campaign",
    id,
    {
      checkedCount: String(candidates.length),
      updatedCount: String(updated),
      transitions: JSON.stringify(transitionCounts),
    },
  );
  return NextResponse.json({
    ok: true,
    checked: candidates.length,
    updated,
    transitions: transitionCounts,
  });
}
