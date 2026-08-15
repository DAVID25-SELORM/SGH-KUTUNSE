import { SmsSettingsForm } from "@/components/admin/SmsSettingsForm";
import { requireAdmin } from "@/lib/server/auth";
import { getSmsPolicy } from "@/lib/server/sms-settings";
import { hasPermission } from "@/lib/types/admin";

export default async function Page() {
  const session = await requireAdmin("sms_settings_view");
  const policy = await getSmsPolicy();
  return <section>
    <p className="text-sm font-semibold text-pink-accent">ADMIN SETTINGS</p>
    <h1 className="text-3xl font-semibold text-purple-deep">SMS Settings</h1>
    <p className="mt-3 text-text-body">Set the hospital-wide hours when SMS campaigns may execute. Ghana time is GMT.</p>
    <SmsSettingsForm initialPolicy={policy} canWrite={hasPermission(session.role, "sms_settings_write")}/>
  </section>;
}
