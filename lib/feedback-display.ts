export const humanizeFeedbackValue = (value: unknown) => {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined || value === "") return "Not provided";
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

export const formatFeedbackDate = (value: unknown, includeTime = false) => {
  const raw = value as { toDate?: () => Date } | string | Date | null | undefined;
  const date = typeof raw === "object" && raw && "toDate" in raw && raw.toDate
    ? raw.toDate()
    : raw instanceof Date ? raw : typeof raw === "string" ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-GH", includeTime
    ? { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Accra" }
    : { dateStyle: "medium", timeZone: "Africa/Accra" }).format(date);
};

export const formatGhs = (value: unknown) => {
  if (value === null || value === undefined || String(value).trim() === "") return "Not provided";
  const raw = String(value).trim();
  const amount = Number(raw.replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(amount)
    : raw.toUpperCase().startsWith("GHS") ? raw : `GHS ${raw}`;
};

export const feedbackStatusLabel = (status: unknown) => ({
  new: "New", in_review: "In Review", contacted: "Contacted", completed: "Resolved",
  cancelled: "Cancelled", archived: "Archived",
}[String(status)] ?? humanizeFeedbackValue(status));

export const feedbackEventLabel = (action: unknown) => ({
  submitted: "Feedback submitted", reviewed: "Marked as reviewed", status_changed: "Status updated",
  assigned: "Assigned to administrator", reassigned: "Reassigned", contacted: "Patient contacted",
  internal_note_added: "Internal note added", completed: "Resolved", archived: "Archived",
}[String(action)] ?? humanizeFeedbackValue(action));
