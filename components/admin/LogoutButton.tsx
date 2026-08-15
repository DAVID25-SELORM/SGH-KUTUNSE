"use client";
import {useRouter} from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  return <button
    type="button"
    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-purple-deep px-3 py-2 text-sm font-semibold text-purple-deep hover:bg-purple-deep hover:text-white"
    onClick={async () => {
      await fetch("/api/auth/session", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    }}
  >
    <LogOut className="h-4 w-4" aria-hidden="true" />
    <span className="hidden sm:inline">Sign out</span>
    <span className="sr-only sm:hidden">Sign out</span>
  </button>;
}
