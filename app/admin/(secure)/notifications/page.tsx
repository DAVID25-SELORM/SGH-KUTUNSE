import { requireAdmin } from "@/lib/server/auth";
import { AdminNotificationHistory } from "@/components/admin/AdminNotificationHistory";

export default async function NotificationsPage() { await requireAdmin(); return <section><p className="text-sm font-semibold text-pink-accent">ADMIN ACTIVITY</p><h1 className="text-3xl font-semibold text-purple-deep">Notifications</h1><AdminNotificationHistory /></section>; }
