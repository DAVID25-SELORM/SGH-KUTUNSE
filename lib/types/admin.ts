export const ADMIN_ROLES = ["super_admin", "admin", "reception", "insurance", "corporate", "content_editor", "viewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AdminRoles = readonly AdminRole[];

export type Permission = "appointments" | "contact" | "insurance" | "corporate" | "telemedicine" | "content" | "users" | "audit" | "feedback" | "feedback_manage" | "feedback_receipts" | "feedback_campaigns" | "feedback_sms" | "contacts" | "contacts_manage" | "sms_settings_view" | "sms_settings_write";

const grants: Record<AdminRole, readonly Permission[]> = {
  super_admin: ["appointments", "contact", "insurance", "corporate", "telemedicine", "content", "users", "audit", "feedback", "feedback_manage", "feedback_receipts", "feedback_campaigns", "feedback_sms", "contacts", "contacts_manage", "sms_settings_view", "sms_settings_write"],
  admin: ["appointments", "contact", "insurance", "corporate", "telemedicine", "content", "audit", "feedback", "feedback_manage", "feedback_campaigns", "contacts", "contacts_manage", "sms_settings_view"],
  reception: ["appointments", "contact", "telemedicine", "feedback", "feedback_manage", "contacts"],
  insurance: ["insurance"],
  corporate: ["corporate"],
  content_editor: ["content"],
  viewer: ["appointments", "contact", "insurance", "corporate", "telemedicine", "feedback"],
};

export function normalizeAdminRoles(value: unknown, legacyRole?: unknown): AdminRole[] {
  const candidates = Array.isArray(value) ? value : [];
  const roles = candidates.filter((role): role is AdminRole => typeof role === "string" && ADMIN_ROLES.includes(role as AdminRole));
  if (typeof legacyRole === "string" && ADMIN_ROLES.includes(legacyRole as AdminRole)) roles.push(legacyRole as AdminRole);
  return ADMIN_ROLES.filter((role) => roles.includes(role));
}

export function primaryAdminRole(roles: AdminRoles): AdminRole {
  return ADMIN_ROLES.find((role) => roles.includes(role)) ?? "viewer";
}

export function hasRole(roles: AdminRole | AdminRoles, role: AdminRole) {
  const roleList: AdminRoles = typeof roles === "string" ? [roles] : roles;
  return roleList.includes(role);
}

export function hasPermission(roles: AdminRole | AdminRoles, permission: Permission) {
  const roleList: AdminRoles = typeof roles === "string" ? [roles] : roles;
  return roleList.some((role) => grants[role].includes(permission));
}

export function canMutate(roles: AdminRole | AdminRoles) {
  const roleList: AdminRoles = typeof roles === "string" ? [roles] : roles;
  return roleList.some((role) => role !== "viewer");
}
