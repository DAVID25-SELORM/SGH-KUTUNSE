import { NextResponse } from "next/server";
import { campaignAudienceSchema } from "@/lib/feedback-campaigns";
import { verifyAdminRequest } from "@/lib/server/auth";
import { loadCampaignAudience } from "@/lib/server/campaign-audience";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_campaigns");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, campaignAudienceSchema);
  if (parsed.error) return parsed.error;
  try { const { summary } = await loadCampaignAudience(parsed.data); return NextResponse.json({ ok: true, ...summary }); }
  catch (error) { if (error instanceof Error && error.message === "AUDIENCE_LIMIT") return NextResponse.json({ ok: false, message: "The contact directory exceeds the 5,000-recipient safety limit. Apply narrower filters." }, { status: 413 }); throw error; }
}
