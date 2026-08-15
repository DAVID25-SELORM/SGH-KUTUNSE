import type { SubmissionKind } from "@/lib/types/submissions";

export const notificationTypes = ["appointments", "contact", "corporate", "insurance", "telemedicine", "feedback"] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const notificationCopy: Record<NotificationType, { title: string; body: string }> = {
  appointments: { title: "New Appointment Request", body: "A new appointment request has been received." },
  contact: { title: "New Contact Message", body: "A new contact message has been received." },
  corporate: { title: "New Corporate Enquiry", body: "A new corporate enquiry has been received." },
  insurance: { title: "New Insurance Request", body: "A new insurance verification request has been received." },
  telemedicine: { title: "New Telemedicine Request", body: "A new telemedicine request has been received." },
  feedback: { title: "New Patient Feedback", body: "A new feedback response has been received." },
};

export function notificationTarget(kind: SubmissionKind, documentId: string) {
  return `/admin/${kind}/${encodeURIComponent(documentId)}`;
}

export function readSeenNotificationIds(value: string | null) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set<string>();
  }
}

export function firstUnseenNotificationId(ids: string[], seen: Set<string>) {
  return ids.find((id) => !seen.has(id));
}
