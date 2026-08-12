"use client";

import { useState } from "react";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(formData: FormData) {
    setBusy(true); setMessage("");
    try {
      if (!firebaseAuth) throw new Error("Firebase Authentication is not configured.");
      const credential = await signInWithEmailAndPassword(firebaseAuth, String(formData.get("email")), String(formData.get("password")));
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Sign-in failed.");
      router.push("/admin"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Sign-in failed."); }
    finally { setBusy(false); }
  }
  async function reset(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    if (!email || !firebaseAuth) { setMessage("Enter your administrator email first."); return; }
    try { await sendPasswordResetEmail(firebaseAuth, email); setMessage("If the account is eligible, Firebase has sent password-reset instructions."); }
    catch { setMessage("Password reset could not be requested. Contact a super administrator."); }
  }
  return <form action={submit} className="flex flex-col gap-5">
    <label className="text-sm font-semibold">Email<input name="email" type="email" required autoComplete="username" className="mt-2 w-full rounded-xl border border-border-default px-4 py-3" /></label>
    <label className="text-sm font-semibold">Password<input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-border-default px-4 py-3" /></label>
    {message && <p className="rounded-xl bg-bg-soft p-3 text-sm" role="status">{message}</p>}
    <button disabled={busy} className="rounded-xl bg-purple-deep px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
    <button type="button" onClick={(event) => reset(new FormData(event.currentTarget.form!))} className="text-sm font-semibold text-purple-deep">Reset password</button>
  </form>;
}
