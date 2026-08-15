import { requireAdmin } from "@/lib/server/auth";
import { adminAuth } from "@/lib/server/firebase-admin";
import { CreateAdminForm } from "@/components/admin/CreateAdminForm";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { hasRole, normalizeAdminRoles } from "@/lib/types/admin";

export default async function Page() {
  const actor = await requireAdmin("users");
  const result = await adminAuth.listUsers(100);
  return <section><h1 className="text-3xl font-semibold text-purple-deep">Admin users</h1><p className="mt-2 text-sm text-text-muted">Firebase Authentication is authoritative; Firestore stores synchronized administrative profile metadata.</p><div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">{result.users.map((user) => { const roles = normalizeAdminRoles(user.customClaims?.roles, user.customClaims?.role); const safeRoles = roles.length ? roles : ["viewer" as const]; return <div key={user.uid} className="border-b border-border-default py-4"><strong>{user.displayName ?? "Unnamed"}</strong><p className="text-sm text-text-muted">{user.email} · {safeRoles.map((role) => role.replaceAll("_", " ")).join(", ")} · {user.disabled ? "disabled" : "active"} · last sign-in {user.metadata.lastSignInTime ?? "never"}</p><AdminUserActions uid={user.uid} roles={safeRoles} disabled={user.disabled}/></div>; })}</div>{hasRole(actor.roles, "super_admin") && <CreateAdminForm/>}</section>;
}
