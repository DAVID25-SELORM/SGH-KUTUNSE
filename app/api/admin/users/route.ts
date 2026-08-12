import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { verifyAdminRequest } from "@/lib/server/auth";
import { parseJson } from "@/lib/server/request";
import { writeAudit } from "@/lib/server/audit";
import { ADMIN_ROLES } from "@/lib/types/admin";

const createSchema = z.strictObject({ email: z.string().trim().toLowerCase().email().max(254), displayName: z.string().trim().min(2).max(100), role: z.enum(ADMIN_ROLES) });
const updateSchema = z.strictObject({ uid: z.string().min(1).max(128), role: z.enum(ADMIN_ROLES).optional(), disabled: z.boolean().optional(), resetLink: z.boolean().optional() });
const sameOrigin = (request:Request) => !request.headers.get("origin") || request.headers.get("origin") === new URL(request.url).origin;

export async function POST(request: Request) {
  if(!sameOrigin(request))return NextResponse.json({ok:false},{status:403});
  const actor = await verifyAdminRequest("users");
  if (!actor || actor.role !== "super_admin") return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, createSchema); if (parsed.error) return parsed.error;
  try {
    const user = await adminAuth.createUser({ email: parsed.data.email, displayName: parsed.data.displayName, emailVerified: false });
    await adminAuth.setCustomUserClaims(user.uid, { role: parsed.data.role });
    try { await adminDb.collection("admin_users").doc(user.uid).set({ ...parsed.data, disabled: false, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }); } catch (error) { await adminAuth.deleteUser(user.uid); throw error; }
    await writeAudit(actor.uid, "admin.created", "admin_user", user.uid, { role: parsed.data.role });
    return NextResponse.json({ ok: true, uid: user.uid }, { status: 201 });
  } catch { return NextResponse.json({ ok: false, message: "Administrator could not be created. Check whether the email already exists." }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  if(!sameOrigin(request))return NextResponse.json({ok:false},{status:403});
  const actor = await verifyAdminRequest("users");
  if (!actor || actor.role !== "super_admin") return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, updateSchema); if (parsed.error) return parsed.error;
  if (parsed.data.uid === actor.uid && parsed.data.disabled) return NextResponse.json({ ok: false, message: "You cannot disable your own account." }, { status: 400 });
  const user = await adminAuth.getUser(parsed.data.uid);
  if (parsed.data.resetLink) {
    if (!user.email) return NextResponse.json({ ok: false, message: "This administrator has no email address." }, { status: 400 });
    const link = await adminAuth.generatePasswordResetLink(user.email);
    await writeAudit(actor.uid, "admin.password_reset_link_created", "admin_user", user.uid);
    return NextResponse.json({ ok: true, resetLink: link });
  }
  const currentRole = String(user.customClaims?.role ?? "");
  const removesSuperAdmin = currentRole === "super_admin" && (parsed.data.role && parsed.data.role !== "super_admin" || parsed.data.disabled === true);
  if (removesSuperAdmin) {
    const activeSuperAdmins = await adminDb.collection("admin_users").where("role", "==", "super_admin").where("disabled", "==", false).count().get();
    if (activeSuperAdmins.data().count <= 1) return NextResponse.json({ ok: false, message: "The final active super administrator cannot be demoted or disabled." }, { status: 409 });
  }
  if (user.uid === actor.uid && parsed.data.role && parsed.data.role !== "super_admin") return NextResponse.json({ ok: false, message: "Use another super administrator to change your own privileged role." }, { status: 400 });
  if (parsed.data.role) await adminAuth.setCustomUserClaims(user.uid, { ...user.customClaims, role: parsed.data.role });
  if (typeof parsed.data.disabled === "boolean") await adminAuth.updateUser(user.uid, { disabled: parsed.data.disabled });
  await adminDb.collection("admin_users").doc(user.uid).set({ ...(parsed.data.role ? { role: parsed.data.role } : {}), ...(typeof parsed.data.disabled === "boolean" ? { disabled: parsed.data.disabled } : {}), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  await adminAuth.revokeRefreshTokens(user.uid);
  await writeAudit(actor.uid, parsed.data.role ? "admin.role_changed" : "admin.access_changed", "admin_user", user.uid);
  return NextResponse.json({ ok: true });
}
