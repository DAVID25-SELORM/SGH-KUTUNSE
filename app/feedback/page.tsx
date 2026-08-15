import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { Container } from "@/components/ui/Container";
import { feedbackTrackingFromSearchParams } from "@/lib/feedback-test-verification";
import { recordFeedbackTestOpen } from "@/lib/server/feedback-test";

export const metadata: Metadata = { title: "Patient Experience Feedback", description: "Share anonymous feedback about your experience at Satellite General Hospital." };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const tracking = feedbackTrackingFromSearchParams(await searchParams);
  if (tracking.testToken) await recordFeedbackTestOpen(tracking.testToken);
  return <><section className="bg-bg-soft py-12 sm:py-16"><Container><p className="font-semibold text-pink-accent">PATIENT EXPERIENCE</p><h1 className="mt-2 text-4xl font-semibold text-purple-deep">Help us improve your experience.</h1><p className="mt-4 max-w-2xl text-text-body">Thank you for choosing Satellite General Hospital. This survey takes approximately 2 minutes. You may submit anonymously.</p><p className="mt-2 font-semibold">No login is required.</p></Container></section><section className="py-10"><Container><div className="mx-auto max-w-3xl rounded-3xl border border-border-default bg-white p-5 shadow-sm sm:p-8"><FeedbackForm initialTracking={tracking}/></div></Container></section></>;
}
