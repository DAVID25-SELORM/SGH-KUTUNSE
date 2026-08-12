import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { createSubmission } from "./submissions";
import { parseJson, publicError } from "./request";
import type { SubmissionKind } from "@/lib/types/submissions";
import { adminAppCheck } from "./firebase-admin";

export function submissionRoute<T extends Record<string, unknown>>(kind: SubmissionKind, schema: ZodType<T>, transform: (data: T) => Record<string, unknown> = (data) => data) {
  return async function POST(request: Request) {
    if (process.env.REQUIRE_FIREBASE_APP_CHECK === "true") {
      const token = request.headers.get("x-firebase-appcheck");
      if (!token) return NextResponse.json({ ok: false, message: "Request verification failed." }, { status: 401 });
      try { await adminAppCheck.verifyToken(token); } catch { return NextResponse.json({ ok: false, message: "Request verification failed." }, { status: 401 }); }
    }
    const parsed = await parseJson(request, schema);
    if (parsed.error) return parsed.error;
    if (parsed.data.website) return NextResponse.json({ ok: true, reference: "SGH-RECEIVED" }, { status: 201 });
    try {
      const safe = { ...parsed.data };
      delete safe.website;
      const reference = await createSubmission(kind, transform(safe as T));
      return NextResponse.json({ ok: true, reference }, { status: 201 });
    } catch {
      return publicError();
    }
  };
}
