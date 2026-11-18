import { z } from "@/lib/zod";

const clean = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .transform((value) => value.replace(/\s+/g, " "));
const optional = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));
const phone = z
  .string()
  .trim()
  .min(9, "Please enter a valid phone number")
  .max(24)
  .regex(/^[+\d][\d\s()-]+$/, "Please enter a valid phone number");
const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email")
  .max(254);
const date = z.iso.date();
const pastOrTodayDate = date.refine(
  (value) => value <= new Date().toISOString().slice(0, 10),
  "Date of visit cannot be in the future.",
);
const honeypot = z.string().max(0).optional();

export const APPOINTMENT_NEEDS = [
  "General consultation",
  "Child / paediatrics",
  "Pregnancy / antenatal",
  "Scan or lab test",
  "Health check / medical",
  "Specialist (ENT, eye, dental, physio)",
  "Online consultation",
  "Something else",
] as const;
export const APPOINTMENT_DAYS = ["Today", "Tomorrow", "Pick a day"] as const;

const todayOrLater = date.refine(
  (value) => value >= new Date().toISOString().slice(0, 10),
  "Choose today or a later date.",
);

// Four things the patient must give us. Everything else is optional or collected at confirmation or registration.
export const appointmentSchema = z
  .strictObject({
    fullName: clean(2, 100),
    phone,
    service: z.enum(APPOINTMENT_NEEDS),
    preferredDay: z.enum(APPOINTMENT_DAYS),
    preferredDate: z.union([todayOrLater, z.literal("")]).optional(),
    preferredDoctor: optional(100),
    insuranceProvider: optional(100),
    notes: optional(1000),
    consent: z.literal(true),
    website: honeypot,
  })
  .superRefine((value, context) => {
    if (value.preferredDay === "Pick a day" && !value.preferredDate)
      context.addIssue({ code: "custom", path: ["preferredDate"], message: "Choose a date." });
  });
export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const contactSchema = z.strictObject({
  fullName: clean(2, 100),
  phone,
  email: email.optional().or(z.literal("")),
  subject: optional(120),
  message: clean(10, 2000),
  website: honeypot,
});
export type ContactInput = z.infer<typeof contactSchema>;

export const insuranceVerificationSchema = z.strictObject({
  fullName: clean(2, 100),
  phone,
  insurer: clean(1, 100),
  memberId: optional(80),
  serviceNeeded: clean(2, 200),
  message: optional(1000),
  website: honeypot,
});
export type InsuranceVerificationInput = z.infer<
  typeof insuranceVerificationSchema
>;

export const corporateEnquirySchema = z.strictObject({
  companyName: clean(2, 150),
  contactName: clean(2, 100),
  phone,
  email,
  employeeCount: z.string().trim().max(30).optional().or(z.literal("")),
  interests: clean(5, 2000),
  website: honeypot,
});
export type CorporateEnquiryInput = z.infer<typeof corporateEnquirySchema>;

export const telemedicineRequestSchema = z.strictObject({
  fullName: clean(2, 100),
  phone,
  email: email.optional().or(z.literal("")),
  preferredContactTime: optional(80),
  request: clean(5, 1000),
  consent: z.literal(true),
  website: honeypot,
});
export type TelemedicineRequestInput = z.infer<
  typeof telemedicineRequestSchema
>;

const rating = z.coerce.number().int().min(1).max(5);
export const feedbackSchema = z
  .strictObject({
    visitType: z.enum(["health_screening", "facility_visit"]),
    serviceUnit: optional(120),
    otherService: optional(120),
    visitDate: pastOrTodayDate,
    ratings: z.strictObject({
      reception: rating,
      waitingTime: rating,
      professionalism: rating,
      cleanliness: rating,
      communication: rating,
      overallQuality: rating,
    }),
    overallSatisfaction: z.enum([
      "very_satisfied",
      "satisfied",
      "neutral",
      "dissatisfied",
      "very_dissatisfied",
    ]),
    dissatisfactionAspect: optional(500),
    improvementDetails: optional(2000),
    recommendation: z.enum([
      "definitely",
      "probably",
      "not_sure",
      "probably_not",
      "definitely_not",
    ]),
    comments: optional(2000),
    appreciation: optional(1000),
    receiptConcern: z.enum(["yes", "no", "prefer_not_to_say"], {
      error: "Please select an answer.",
    }),
    receiptDetails: z
      .strictObject({
        unit: optional(120),
        person: optional(120),
        description: optional(500),
        amount: optional(50),
        explanation: optional(1000),
      })
      .optional(),
    contactRequested: z.boolean(),
    contactName: optional(100),
    contactPhone: phone.optional().or(z.literal("")),
    contactEmail: email.optional().or(z.literal("")),
    preferredContact: z.enum(["phone", "email", "either"]).optional(),
    campaign: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{1,80}$/)
      .optional()
      .or(z.literal("")),
    testToken: z.string().trim().regex(/^[A-Za-z0-9_-]{32,160}$/).optional().or(z.literal("")),
    source: z
      .enum(["website", "health_screening", "facility", "qr", "sms"])
      .default("website"),
    website: honeypot,
  })
  .superRefine((data, ctx) => {
    if (data.visitType === "facility_visit" && !data.serviceUnit)
      ctx.addIssue({
        code: "custom",
        path: ["serviceUnit"],
        message: "Select the service or unit visited.",
      });
    if (data.serviceUnit === "Other" && !data.otherService)
      ctx.addIssue({
        code: "custom",
        path: ["otherService"],
        message: "Please state the service.",
      });
    if (
      ["dissatisfied", "very_dissatisfied"].includes(
        data.overallSatisfaction,
      ) &&
      !data.dissatisfactionAspect
    )
      ctx.addIssue({
        code: "custom",
        path: ["dissatisfactionAspect"],
        message: "Please identify the unit or aspect.",
      });
    if (
      data.receiptConcern === "yes" &&
      !data.receiptDetails?.explanation &&
      !data.receiptDetails?.unit
    )
      ctx.addIssue({
        code: "custom",
        path: ["receiptDetails", "explanation"],
        message: "Please provide any details you remember.",
      });
    if (data.contactRequested && !data.contactPhone && !data.contactEmail)
      ctx.addIssue({
        code: "custom",
        path: ["contactPhone"],
        message: "Provide a phone number or email for follow-up.",
      });
  });
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type FeedbackFormInput = z.input<typeof feedbackSchema>;
