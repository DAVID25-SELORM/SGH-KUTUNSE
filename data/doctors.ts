import type { Doctor } from "@/types";

export const doctors: Doctor[] = [];

export const specialties = [
  { name: "General Medicine", description: "Assessment and care for common illnesses, ongoing health concerns, and preventive needs." },
  { name: "Obstetrics & Gynaecology", description: "Specialist care for women across different stages of life." },
  { name: "Paediatrics", description: "Compassionate medical care for infants, children, and adolescents." },
  { name: "ENT", description: "Assessment and treatment for ear, nose, and throat concerns." },
  { name: "Dental", description: "Oral health assessment, preventive care, and dental treatment." },
  { name: "Eye Care", description: "Eye examinations and care for vision and eye-health concerns." },
  { name: "Physiotherapy", description: "Support for mobility, rehabilitation, pain management, and physical recovery." },
  { name: "Other Specialist Clinics", description: "Additional specialist services are arranged according to the hospital clinic schedule." },
] as const;

export const doctorSpecialtyFilters = ["All", ...specialties.map(({ name }) => name)] as const;
