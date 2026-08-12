export const SUBMISSION_STATUSES = ["new", "in_review", "contacted", "completed", "cancelled", "archived"] as const;
export const PRIORITIES = ["normal", "high", "urgent"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
export type SubmissionPriority = (typeof PRIORITIES)[number];
const transitions:Record<SubmissionStatus,readonly SubmissionStatus[]>={new:["in_review","contacted","cancelled","archived"],in_review:["contacted","completed","cancelled","archived"],contacted:["in_review","completed","cancelled","archived"],completed:["in_review","archived"],cancelled:["in_review","archived"],archived:["in_review"]};
export function canTransition(from:SubmissionStatus,to:SubmissionStatus){return from===to||transitions[from].includes(to)}

export const submissionKinds = {
  appointments: { collection: "appointment_requests", prefix: "APT", permission: "appointments", label: "Appointments" },
  contact: { collection: "contact_messages", prefix: "CON", permission: "contact", label: "Contact Messages" },
  corporate: { collection: "corporate_enquiries", prefix: "COR", permission: "corporate", label: "Corporate Enquiries" },
  insurance: { collection: "insurance_verifications", prefix: "INS", permission: "insurance", label: "Insurance Requests" },
  telemedicine: { collection: "telemedicine_requests", prefix: "TEL", permission: "telemedicine", label: "Telemedicine Requests" },
} as const;
export type SubmissionKind = keyof typeof submissionKinds;
