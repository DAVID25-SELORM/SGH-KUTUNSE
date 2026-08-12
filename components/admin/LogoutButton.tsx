"use client";
import {useRouter} from "next/navigation";
export function LogoutButton() { const router=useRouter(); return <button className="text-sm font-semibold text-white/80" onClick={async () => { await fetch("/api/auth/session", { method: "DELETE" }); router.push("/admin/login"); router.refresh(); }}>Sign out</button>; }
