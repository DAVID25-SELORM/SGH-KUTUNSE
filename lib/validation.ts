import { z } from "zod";

const clean = (min: number, max: number) => z.string().trim().min(min).max(max).transform((value) => value.replace(/\s+/g, " "));
const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const phone = z.string().trim().min(9, "Please enter a valid phone number").max(24).regex(/^[+\d][\d\s()-]+$/, "Please enter a valid phone number");
const email = z.string().trim().toLowerCase().email("Please enter a valid email").max(254);
const date = z.iso.date();
const honeypot = z.string().max(0).optional();

export const appointmentSchema = z.strictObject({
  fullName: clean(2, 100), phone, email: email.optional().or(z.literal("")),
  sex: z.enum(["Female", "Male"]), dateOfBirth: date, service: clean(1, 100),
  preferredDoctor: optional(100), preferredDate: date, preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  insuranceProvider: optional(100), paymentMethod: z.enum(["Self Pay", "Insurance"]),
  reasonForVisit: clean(5, 1000), patientType: z.enum(["New Patient", "Existing Patient"]),
  consent: z.literal(true), website: honeypot,
});
export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const contactSchema = z.strictObject({
  fullName: clean(2, 100), phone, email: email.optional().or(z.literal("")), subject: optional(120),
  message: clean(10, 2000), website: honeypot,
});
export type ContactInput = z.infer<typeof contactSchema>;

export const insuranceVerificationSchema = z.strictObject({
  fullName: clean(2, 100), phone, insurer: clean(1, 100), memberId: optional(80),
  serviceNeeded: clean(2, 200), message: optional(1000), website: honeypot,
});
export type InsuranceVerificationInput = z.infer<typeof insuranceVerificationSchema>;

export const corporateEnquirySchema = z.strictObject({
  companyName: clean(2, 150), contactName: clean(2, 100), phone, email,
  employeeCount: z.string().trim().max(30).optional().or(z.literal("")), interests: clean(5, 2000), website: honeypot,
});
export type CorporateEnquiryInput = z.infer<typeof corporateEnquirySchema>;

export const telemedicineRequestSchema = z.strictObject({
  fullName: clean(2, 100), phone, email: email.optional().or(z.literal("")),
  preferredContactTime: optional(80), request: clean(5, 1000), consent: z.literal(true), website: honeypot,
});
export type TelemedicineRequestInput = z.infer<typeof telemedicineRequestSchema>;
