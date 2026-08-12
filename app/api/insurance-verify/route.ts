import { insuranceVerificationSchema } from "@/lib/validation";
import { submissionRoute } from "@/lib/server/public-route";
export const runtime = "nodejs";
export const POST = submissionRoute("insurance", insuranceVerificationSchema);
