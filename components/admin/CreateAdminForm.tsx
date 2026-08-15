"use client";

import { useState } from "react";
import { ADMIN_ROLES, type AdminRole } from "@/lib/types/admin";

const roleLabel = (role: AdminRole) => role.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function CreateAdminForm() {
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [roles, setRoles] = useState<AdminRole[]>(["viewer"]);
  function toggleRole(role: AdminRole, checked: boolean) { setRoles((current) => checked ? [...current, role] : current.filter((item) => item !== role)); }
  async function submit(formData: FormData) {
    setMessage(""); setLink("");
    if (!roles.length) { setMessage("Select at least one role."); return; }
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: formData.get("email"), displayName: formData.get("displayName"), roles }) });
    const result = await response.json();
    setMessage(response.ok ? "Administrator created. Share the one-time setup link securely with the approved staff member." : result.message ?? "Could not create administrator.");
    if (response.ok) setLink(result.resetLink);
  }
  return <form action={submit} className="mt-6 grid gap-4 rounded-2xl border border-border-default bg-white p-5 shadow-sm">
    <div><h2 className="text-lg font-semibold">Add administrator</h2><p className="mt-1 text-sm text-text-muted">Creates a Firebase Authentication account with no public registration or stored password.</p></div>
    <label className="text-sm font-semibold">Full name<input name="displayName" required className="mt-1 w-full rounded-xl border border-border-default p-3"/></label>
    <label className="text-sm font-semibold">Email<input name="email" type="email" required className="mt-1 w-full rounded-xl border border-border-default p-3"/></label>
    <fieldset><legend className="text-sm font-semibold">Roles</legend><p className="mt-1 text-xs text-text-muted">Select one or more roles. Access is the combined permissions of every selected role.</p><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{ADMIN_ROLES.map((role) => <label key={role} className="flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm"><input type="checkbox" checked={roles.includes(role)} onChange={(event) => toggleRole(role, event.target.checked)}/>{roleLabel(role)}</label>)}</div></fieldset>
    <button className="min-h-11 rounded-xl bg-purple-deep p-3 font-semibold text-white">Create account and invitation</button>
    {message && <p role="status" className="text-sm">{message}</p>}{link && <label className="text-sm font-semibold">One-time setup link<input readOnly value={link} className="mt-1 w-full rounded-lg border p-2 text-xs"/></label>}
  </form>;
}
