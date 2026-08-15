import { NextResponse } from "next/server";
import { z } from "@/lib/zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";
import { verifyAdminRequest } from "@/lib/server/auth";
import { parseJson } from "@/lib/server/request";
import { writeAudit } from "@/lib/server/audit";
import {
  ADMIN_ROLES,
  canViewAdminIdentity,
  hasRole,
  normalizeAdminRoles,
  primaryAdminRole,
} from "@/lib/types/admin";
import { isTrustedOrigin } from "@/lib/server/origin";

const rolesSchema = z
  .array(z.enum(ADMIN_ROLES))
  .min(1, "Select at least one role.")
  .max(ADMIN_ROLES.length)
  .transform((roles) => normalizeAdminRoles(roles));
const createSchema = z.strictObject({
  email: z.string().trim().toLowerCase().email().max(254),
  displayName: z.string().trim().min(2).max(100),
  roles: rolesSchema,
});
const updateSchema = z.strictObject({
  uid: z.string().min(1).max(128),
  roles: rolesSchema.optional(),
  disabled: z.boolean().optional(),
  resetLink: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!isTrustedOrigin(request))
    return NextResponse.json(
      { ok: false, message: "Untrusted request origin." },
      { status: 403 },
    );
  const actor = await verifyAdminRequest("users");
  if (!actor || !hasRole(actor.roles, "super_admin"))
    return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, createSchema);
  if (parsed.error) return parsed.error;
  try {
    const user = await adminAuth.createUser({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      emailVerified: false,
    });
    const role = primaryAdminRole(parsed.data.roles);
    await adminAuth.setCustomUserClaims(user.uid, {
      role,
      roles: parsed.data.roles,
    });
    try {
      await adminDb
        .collection("admin_users")
        .doc(user.uid)
        .set({
          ...parsed.data,
          role,
          disabled: false,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
    } catch (error) {
      await adminAuth.deleteUser(user.uid);
      throw error;
    }
    const resetLink = await adminAuth.generatePasswordResetLink(user.email!);
    await writeAudit(actor.uid, "admin.created", "admin_user", user.uid, {
      roles: parsed.data.roles.join(","),
    });
    await writeAudit(
      actor.uid,
      "admin.invitation_created",
      "admin_user",
      user.uid,
    );
    return NextResponse.json(
      { ok: true, uid: user.uid, resetLink },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Administrator could not be created. Check whether the email already exists.",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!isTrustedOrigin(request))
    return NextResponse.json(
      { ok: false, message: "Untrusted request origin." },
      { status: 403 },
    );
  const actor = await verifyAdminRequest("users");
  if (!actor || !hasRole(actor.roles, "super_admin"))
    return NextResponse.json({ ok: false }, { status: 403 });
  const parsed = await parseJson(request, updateSchema);
  if (parsed.error) return parsed.error;
  if (parsed.data.uid === actor.uid && parsed.data.disabled)
    return NextResponse.json(
      { ok: false, message: "You cannot disable your own account." },
      { status: 400 },
    );
  const user = await adminAuth.getUser(parsed.data.uid);
  const currentRoles = normalizeAdminRoles(
    user.customClaims?.roles,
    user.customClaims?.role,
  );
  if (!canViewAdminIdentity(actor.uid, user.uid, currentRoles))
    return NextResponse.json(
      { ok: false, message: "Administrator not found." },
      { status: 404 },
    );
  if (parsed.data.resetLink) {
    if (!user.email)
      return NextResponse.json(
        { ok: false, message: "This administrator has no email address." },
        { status: 400 },
      );
    const link = await adminAuth.generatePasswordResetLink(user.email);
    await writeAudit(
      actor.uid,
      "admin.password_reset_link_created",
      "admin_user",
      user.uid,
    );
    return NextResponse.json({ ok: true, resetLink: link });
  }
  const removesSuperAdmin =
    currentRoles.includes("super_admin") &&
    ((parsed.data.roles && !parsed.data.roles.includes("super_admin")) ||
      parsed.data.disabled === true);
  if (removesSuperAdmin) {
    const users = await adminAuth.listUsers(1000);
    const activeSuperAdmins = users.users.filter(
      (item) =>
        !item.disabled &&
        normalizeAdminRoles(
          item.customClaims?.roles,
          item.customClaims?.role,
        ).includes("super_admin"),
    ).length;
    if (activeSuperAdmins <= 1)
      return NextResponse.json(
        {
          ok: false,
          message:
            "The final active super administrator cannot be demoted or disabled.",
        },
        { status: 409 },
      );
  }
  if (
    user.uid === actor.uid &&
    parsed.data.roles &&
    !parsed.data.roles.includes("super_admin")
  )
    return NextResponse.json(
      {
        ok: false,
        message:
          "Use another super administrator to change your own privileged role.",
      },
      { status: 400 },
    );
  if (parsed.data.roles)
    await adminAuth.setCustomUserClaims(user.uid, {
      ...user.customClaims,
      role: primaryAdminRole(parsed.data.roles),
      roles: parsed.data.roles,
    });
  if (typeof parsed.data.disabled === "boolean")
    await adminAuth.updateUser(user.uid, { disabled: parsed.data.disabled });
  await adminDb
    .collection("admin_users")
    .doc(user.uid)
    .set(
      {
        ...(parsed.data.roles
          ? {
              role: primaryAdminRole(parsed.data.roles),
              roles: parsed.data.roles,
            }
          : {}),
        ...(typeof parsed.data.disabled === "boolean"
          ? { disabled: parsed.data.disabled }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  await adminAuth.revokeRefreshTokens(user.uid);
  await writeAudit(
    actor.uid,
    parsed.data.roles ? "admin.roles_changed" : "admin.access_changed",
    "admin_user",
    user.uid,
    parsed.data.roles ? { roles: parsed.data.roles.join(",") } : {},
  );
  return NextResponse.json({ ok: true });
}
