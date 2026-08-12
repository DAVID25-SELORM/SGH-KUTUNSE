import type { Doctor } from "@/types";
export const doctors: Doctor[] = [];
export const doctorSpecialtyFilters = ["All", "General Medicine", "Gynaecology", "Paediatrics", "ENT", "Dental", "Eye", "Physiotherapy", "Other"] as const;
export const approvedSpecialties = doctorSpecialtyFilters.filter((specialty) => specialty !== "All" && specialty !== "Other");
export function getDoctorBySlug(slug: string) { return doctors.find((doctor) => doctor.slug === slug); }
