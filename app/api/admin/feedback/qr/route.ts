import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { verifyAdminRequest } from "@/lib/server/auth";
import { isTrustedOrigin } from "@/lib/server/origin";
import { parseJson } from "@/lib/server/request";
import { z } from "@/lib/zod";

const qrSchema = z.strictObject({
  source: z.enum(["reception", "opd", "health_screening", "laboratory", "pharmacy"]),
});

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const actor = await verifyAdminRequest("feedback_campaigns");
  if (!actor) return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, qrSchema);
  if (parsed.error) return parsed.error;
  const url = new URL("/feedback", "https://satellitegeneralhospital.com");
  url.searchParams.set("source", "qr");
  url.searchParams.set("campaign", `qr_${parsed.data.source}`);
  const dataUrl = await QRCode.toDataURL(url.toString(), { width: 640, margin: 2, errorCorrectionLevel: "H" });
  return NextResponse.json({ ok: true, dataUrl }, { headers: { "Cache-Control": "private, no-store" } });
}
