import { requireAdmin } from "@/lib/server/auth";
import { AdminShell } from "@/components/admin/AdminShell";
export const dynamic = "force-dynamic";
export default async function AdminLayout({children}:{children:React.ReactNode}){const session=await requireAdmin();return <AdminShell email={session.email??"Administrator"} role={session.role}>{children}</AdminShell>}
