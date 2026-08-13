import { requireAdmin } from "@/lib/server/auth";
import { getSmsProvider } from "@/lib/server/sms";
import { FeedbackQr } from "@/components/admin/FeedbackQr";
export default async function Page() {
  await requireAdmin("feedback_campaigns");
  const provider = getSmsProvider();
  const message =
    "Satellite General Hospital: Thank you for allowing us to serve you. Please take 1–2 minutes to share your experience with us. Your feedback may be submitted anonymously. https://satellitegeneralhospital.com/feedback";
  return (
    <section>
      <p className="text-sm font-semibold text-pink-accent">PATIENT FEEDBACK</p>
      <h1 className="text-3xl font-semibold text-purple-deep">SMS campaigns</h1>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <strong>Mock mode — real sending disabled</strong>
        <p className="mt-2 text-sm">
          Campaign planning and previews are safe to review locally. Configure
          an approved provider secret, sender ID and delivery webhook before
          enabling live sending.
        </p>
      </div>
      <div className="mt-6 rounded-2xl border bg-white p-6">
        <h2 className="font-semibold">Message preview</h2>
        <p className="mt-3 rounded-xl bg-bg-soft p-4 text-sm">{message}</p>
        <p className="mt-3 text-sm text-text-muted">
          Provider: {provider.mode}. Recipient import and batch confirmation
          remain disabled until hospital privacy, retention, opt-out and
          sender-ID approvals are recorded.
        </p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">Campaign workflow</h2><ol className="mt-4 list-decimal space-y-2 pl-5 text-sm"><li>Name the campaign and select a non-identifying source.</li><li>Import and normalize consented Ghana phone numbers.</li><li>Remove duplicates, opt-outs, and previous sends.</li><li>Review recipient count and controlled message.</li><li>Require explicit batch confirmation.</li><li>Record provider acceptance, handset delivery, failures and responses separately.</li></ol><p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm">Creation, import and send controls remain intentionally locked until privacy, retention, opt-out, provider and sender-ID approvals are recorded.</p></div>
        <FeedbackQr />
      </div>
    </section>
  );
}
