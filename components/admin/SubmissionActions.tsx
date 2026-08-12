"use client";
import { useState } from "react";
import { SUBMISSION_STATUSES, type SubmissionKind } from "@/lib/types/submissions";
export function SubmissionActions({ kind, id, status }: { kind: SubmissionKind; id: string; status: string }) {
  const [message,setMessage]=useState("");
  async function update(formData: FormData) { const response=await fetch(`/api/admin/submissions/${kind}/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:formData.get("status"),assignedTo:formData.get("assignedTo")||null,note:formData.get("note")||undefined})}); setMessage(response.ok?"Changes saved.":"Changes could not be saved."); if(response.ok) window.location.reload(); }
  return <form action={update} className="mt-6 grid gap-4 rounded-2xl bg-bg-soft p-5"><h2 className="text-lg font-semibold">Workflow actions</h2><select name="status" defaultValue={status} className="rounded-xl border border-border-default bg-white px-3 py-2">{SUBMISSION_STATUSES.map(s=><option key={s}>{s}</option>)}</select><input name="assignedTo" placeholder="Assigned staff UID (optional)" className="rounded-xl border border-border-default bg-white px-3 py-2"/><textarea name="note" maxLength={2000} placeholder="Add an internal note (optional)" className="rounded-xl border border-border-default bg-white px-3 py-2"/><button className="rounded-xl bg-purple-deep px-4 py-2 font-semibold text-white">Save changes</button>{message&&<p role="status">{message}</p>}</form>;
}

