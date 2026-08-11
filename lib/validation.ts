import { z } from "zod";

export const appointmentSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  phone: z.string().min(9, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  sex: z.enum(["Female", "Male"], { message: "Please select an option" }),
  dateOfBirth: z.string().min(1, "Please enter your date of birth"),
  service: z.string().min(1, "Please select a service"),
  preferredDoctor: z.string().optional(),
  preferredDate: z.string().min(1, "Please select a preferred date"),
  preferredTime: z.string().min(1, "Please select a preferred time"),
  insuranceProvider: z.string().optional(),
  paymentMethod: z.enum(["Self Pay", "Insurance"], { message: "Please select a payment method" }),
  reasonForVisit: z.string().min(5, "Please briefly describe your reason for visiting"),
  patientType: z.enum(["New Patient", "Existing Patient"], { message: "Please select an option" }),
  consent: z.boolean().refine((val) => val === true, { message: "You must consent before submitting" }),
});
export type AppointmentInput = z.infer<typeof appointmentSchema>;

export const contactSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  phone: z.string().min(9, "Please enter a valid phone number"),
  message: z.string().min(10, "Please enter a message (min 10 characters)"),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const insuranceVerificationSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  phone: z.string().min(9, "Please enter a valid phone number"),
  insurer: z.string().min(1, "Please select your insurer"),
  memberId: z.string().optional(),
  serviceNeeded: z.string().min(2, "Please tell us what service you need"),
  message: z.string().optional(),
});
export type InsuranceVerificationInput = z.infer<typeof insuranceVerificationSchema>;

export const corporateEnquirySchema = z.object({
  companyName: z.string().min(2, "Please enter your company name"),
  contactName: z.string().min(2, "Please enter a contact person"),
  phone: z.string().min(9, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email"),
  employeeCount: z.string().optional(),
  interests: z.string().min(5, "Please briefly describe what you're interested in"),
});
export type CorporateEnquiryInput = z.infer<typeof corporateEnquirySchema>;
