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
  } catch (error) {
    const errorClass = error instanceof Error ? error.message : "unknown";
    console.error("feedback_test_verification", { event: "submission_failed", campaignId: parsed.data.campaign || null, errorClass });
    if (errorClass === "FEEDBACK_ALREADY_SUBMITTED")
      return NextResponse.json(
        { ok: false, message: "This feedback link has already been used. Your previous response was received; no second submission is needed." },
        { status: 409 },
      );
    if (errorClass === "FEEDBACK_LINK_EXPIRED")
      return NextResponse.json(
        { ok: false, message: "This feedback link has expired. Please use the newest link sent by the hospital." },
        { status: 410 },
      );
    if (errorClass === "INVALID_TEST_TOKEN")
      return NextResponse.json(
        { ok: false, message: "This secure feedback link is no longer valid. Please use the newest link sent by the hospital." },
        { status: 400 },
      );
    return publicError();
  }
}
