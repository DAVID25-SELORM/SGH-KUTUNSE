import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./firebase-admin";
import { ADMIN_ROLES, type AdminRole, hasPermission, type Permission } from "@/lib/types/admin";

export const SESSION_COOKIE = "sgh_admin_session";

export type AdminSession = DecodedIdToken & { role: AdminRole };

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  try {
    const token = await adminAuth.verifySessionCookie(value, true);
    const role = token.role;
    if (typeof role !== "string" || !ADMIN_ROLES.includes(role as AdminRole)) return null;
    return { ...token, role: role as AdminRole };
  } catch {
    return null;
  }
});

export async function requireAdmin(permission?: Permission) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (permission && !hasPermission(session.role, permission)) redirect("/admin?denied=1");
  return session;
}

export async function verifyAdminRequest(permission: Permission) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, permission)) return null;
  return session;
}

