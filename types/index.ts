export interface Service {
  slug: string;
  name: string;
  shortDescription: string;
  category: string;
  icon: string;
  image?: string;
  imageAlt?: string;
  imagePosition?: string;
  featured?: boolean;
  covers?: string[];
  whenToSeekCare?: string[];
  whatToExpect?: string[];
  diagnostics?: string[];
  relatedServiceSlugs?: string[];
}

export interface Doctor {
  slug: string;
  fullName: string;
  specialty: string;
  role: string;
  bio: string;
  availability: string;
  photo: string;
  isDemoData: boolean;
}

export type DoctorSpecialty =
  | "General Medicine"
  | "Gynaecology"
  | "Paediatrics"
  | "ENT"
  | "Dental"
  | "Eye"
  | "Physiotherapy"
  | "Other";

export interface Insurer {
  name: string;
}

export interface Article {
  slug: string;
  title: string;
  category: string;
  date: string;
  heroImage: string;
  authorPlaceholder: string;
  excerpt: string;
  content: string[];
  isDemoContent: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface FAQItem {
  category: string;
  question: string;
  answer: string;
}
