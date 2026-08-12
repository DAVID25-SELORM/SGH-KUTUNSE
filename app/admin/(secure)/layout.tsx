import Link from "next/link";
import { requireAdmin } from "@/lib/server/auth";
import { LogoutButton } from "@/components/admin/LogoutButton";
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const links = [["/admin","Dashboard"],["/admin/appointments","Appointments"],["/admin/contact","Contact"],["/admin/insurance","Insurance"],["/admin/corporate","Corporate"],["/admin/telemedicine","Telemedicine"],["/admin/users","Admin users"],["/admin/audit","Audit log"],["/admin/content","Content"]];
  return <div className="min-h-[70vh] bg-neutral-light"><div className="bg-purple-deep px-5 py-4 text-white"><div className="mx-auto flex max-w-7xl items-center justify-between"><div><strong>SGH Admin</strong><span className="ml-3 text-sm text-white/80">{session.email} · {session.role.replaceAll("_", " ")}</span></div><LogoutButton /></div></div><div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[240px_1fr]"><nav className="flex h-fit flex-col gap-1 rounded-2xl bg-white p-3 shadow-sm">{links.map(([href,label]) => <Link key={href} href={href} className="rounded-xl px-4 py-3 text-sm font-semibold text-text-body hover:bg-bg-soft hover:text-purple-deep">{label}</Link>)}</nav><main>{children}</main></div></div>;
}

