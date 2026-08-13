import { NextResponse } from "next/server";
import { feedbackSchema } from "@/lib/validation";
import { parseJson, publicError } from "@/lib/server/request";
import { adminAppCheck } from "@/lib/server/firebase-admin";
import { createFeedback } from "@/lib/server/feedback";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (process.env.REQUIRE_FIREBASE_APP_CHECK === "true") {
    const token = request.headers.get("x-firebase-appcheck");
    if (!token)
      return NextResponse.json(
        { ok: false, message: "Request verification failed." },
        { status: 401 },
      );
    try {
      await adminAppCheck.verifyToken(token);
    } catch {
      return NextResponse.json(
        { ok: false, message: "Request verification failed." },
        { status: 401 },
      );
    }
  }
  const parsed = await parseJson(request, feedbackSchema);
  if (parsed.error) return parsed.error;
  if (parsed.data.website)
    return NextResponse.json(
      { ok: true, reference: "SGH-RECEIVED" },
      { status: 201 },
    );
  try {
    return NextResponse.json(
      { ok: true, reference: await createFeedback(parsed.data) },
      { status: 201 },
    );
  } catch {
    return publicError();
  }
}
