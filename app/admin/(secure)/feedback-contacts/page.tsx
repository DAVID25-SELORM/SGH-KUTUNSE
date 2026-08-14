import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/server/auth";

export default async function FeedbackContactsPage(){await requireAdmin("contacts");redirect("/admin/contacts")}
