import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/server/firebase-admin";
import { normalizeAdminRoles } from "@/lib/types/admin";
import { SESSION_COOKIE } from "@/lib/server/auth";
import { writeAudit } from "@/lib/server/audit";
import { isTrustedOrigin } from "@/lib/server/origin";

const expiresIn = 8 * 60 * 60 * 1000;

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) return NextResponse.json({ ok: false, message: "Untrusted request origin." }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return NextResponse.json({ ok: false }, { status: 415 });
  try {
    const { idToken } = (await request.json()) as { idToken?: unknown };
    if (typeof idToken !== "string" || idToken.length > 5000) throw new Error("invalid");
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    if (!normalizeAdminRoles(decoded.roles, decoded.role).length) return NextResponse.json({ ok: false, message: "This account is not authorized for administration." }, { status: 403 });
    const session = await adminAuth.createSessionCookie(idToken, { expiresIn });
    await writeAudit(decoded.uid, "admin.login", "admin_user", decoded.uid);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: expiresIn / 1000 });
    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "Sign-in failed." }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
