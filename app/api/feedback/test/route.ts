import { NextResponse } from "next/server";
import { recordFeedbackTestOpen } from "@/lib/server/feedback-test";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { token?: string } | null;
  const token = body?.token?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{32,160}$/.test(token)) return NextResponse.json({ ok: false }, { status: 400 });
  const result = await recordFeedbackTestOpen(token);
  if (result.ok) console.info("feedback_test_verification", { event: "link_open_recorded", campaignId: result.campaignId });
  else console.warn("feedback_test_verification", { event: "link_open_rejected", campaignId: null, reason: result.reason });
  return NextResponse.json({ ok: result.ok }, { headers: { "Cache-Control": "no-store" } });
}
