export const ADMIN_ROLES = ["super_admin", "admin", "reception", "insurance", "corporate", "content_editor", "viewer"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type Permission = "appointments" | "contact" | "insurance" | "corporate" | "telemedicine" | "content" | "users" | "audit" | "feedback" | "feedback_manage" | "feedback_receipts" | "feedback_campaigns" | "feedback_sms" | "contacts" | "contacts_manage";

const grants: Record<AdminRole, readonly Permission[]> = {
  super_admin: ["appointments", "contact", "insurance", "corporate", "telemedicine", "content", "users", "audit", "feedback", "feedback_manage", "feedback_receipts", "feedback_campaigns", "feedback_sms", "contacts", "contacts_manage"],
  admin: ["appointments", "contact", "insurance", "corporate", "telemedicine", "content", "audit", "feedback", "feedback_manage", "feedback_campaigns", "contacts", "contacts_manage"],
  reception: ["appointments", "contact", "telemedicine", "feedback", "feedback_manage", "contacts"],
  insurance: ["insurance"],
  corporate: ["corporate"],
  content_editor: ["content"],
  viewer: ["appointments", "contact", "insurance", "corporate", "telemedicine", "feedback"],
};

export function hasPermission(role: AdminRole, permission: Permission) {
  return grants[role].includes(permission);
}

export function canMutate(role: AdminRole) {
  return role !== "viewer";
}
