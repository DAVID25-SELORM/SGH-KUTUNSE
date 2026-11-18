import { appointmentSchema } from "@/lib/validation";
import { submissionRoute } from "@/lib/server/public-route";
export const runtime = "nodejs";

const isoDay = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

// Ghana observes GMT all year, so the UTC date is the local date.
export const POST = submissionRoute("appointments", appointmentSchema, (data) => ({
  ...data,
  preferredDate: data.preferredDate || (data.preferredDay === "Tomorrow" ? isoDay(1) : isoDay(0)),
}));
