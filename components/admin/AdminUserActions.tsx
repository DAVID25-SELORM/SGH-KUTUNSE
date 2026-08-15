"use client";

import { useState } from "react";
import { ADMIN_ROLES, type AdminRole } from "@/lib/types/admin";

export function AdminUserActions({ uid, roles: initialRoles, disabled }: { uid: string; roles: AdminRole[]; disabled: boolean }) {
  const [roles, setRoles] = useState(initialRoles);
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const rolesChanged = roles.join("|") !== initialRoles.join("|");
  async function update(payload: Record<string, unknown>) { setMessage(""); setResetLink(""); const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid, ...payload }) }); const result = await response.json(); if (!response.ok) { setMessage(result.message ?? "Change failed."); return; } if (result.resetLink) setResetLink(result.resetLink); else { setMessage("Account updated. The administrator must sign in again for role changes to take effect."); window.location.reload(); } }
  function toggle(role: AdminRole, checked: boolean) { setRoles((current) => ADMIN_ROLES.filter((item) => checked ? current.includes(item) || item === role : current.includes(item) && item !== role)); }
  return <div className="mt-3 space-y-3"><fieldset><legend className="text-xs font-semibold">Assigned roles</legend><div className="mt-2 flex flex-wrap gap-2">{ADMIN_ROLES.map((role) => <label key={role} className="flex items-center gap-2 rounded-lg border border-border-default px-3 py-2 text-xs"><input type="checkbox" checked={roles.includes(role)} onChange={(event) => toggle(role, event.target.checked)}/>{role.replaceAll("_", " ")}</label>)}</div></fieldset><div className="flex flex-wrap items-center gap-2"><button disabled={!rolesChanged || !roles.length} onClick={() => update({ roles })} className="rounded-lg border border-purple-deep px-3 py-2 text-xs font-semibold text-purple-deep disabled:opacity-40">Save roles</button><button onClick={() => update({ disabled: !disabled })} className="rounded-lg border border-border-default px-3 py-2 text-xs font-semibold">{disabled ? "Enable" : "Disable"}</button><button onClick={() => update({ resetLink: true })} className="rounded-lg border border-border-default px-3 py-2 text-xs font-semibold">Create reset link</button>{message && <span className="text-xs">{message}</span>}{resetLink && <label className="w-full text-xs">One-time reset link<input readOnly value={resetLink} className="mt-1 w-full rounded-lg border border-border-default p-2"/></label>}</div></div>;
}
