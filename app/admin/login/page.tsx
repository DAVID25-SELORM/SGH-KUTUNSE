import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/server/auth";
import { LoginForm } from "@/components/admin/LoginForm";
export const dynamic = "force-dynamic";
export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return <section className="bg-bg-soft px-5 py-20"><div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm"><p className="text-sm font-semibold text-pink-accent">SECURE STAFF ACCESS</p><h1 className="mt-3 text-3xl font-semibold text-purple-deep">Hospital administration</h1><p className="mt-3 mb-6 text-text-body">Authorized staff only. Public registration is disabled.</p><LoginForm /></div></section>;
}

