import type { Service } from "@/types";

export const services: Service[] = [
  {
    slug: "general-opd",
    name: "24/7 General OPD Services",
    shortDescription: "Round-the-clock outpatient consultations for everyday health concerns.",
    category: "Primary & General Care",
    icon: "Stethoscope",
    image: "/images/hospital/general-consultation.jpg",
    imageAlt: "Healthcare professional speaking with a patient during a consultation",
    featured: true,
    covers: [
      "Walk-in consultations for common illnesses and injuries",
      "General check-ups and referrals",
      "Follow-up consultations",
    ],
    whenToSeekCare: [
      "Fever, infections, or general unwellness",
      "Minor injuries that need medical attention",
      "Routine health concerns that need a doctor's opinion",
    ],
    whatToExpect: [
      "Registration at the OPD desk",
      "Consultation with a duty doctor",
      "Referral to laboratory, pharmacy, or a specialist if needed",
    ],
    relatedServiceSlugs: ["laboratory", "pharmacy", "in-patient-services"],
  },
  {
    slug: "in-patient-services",
    name: "In-Patient Services",
    shortDescription: "Supervised hospital admission and ward care for patients who need it.",
    category: "Primary & General Care",
    icon: "BedDouble",
    covers: ["Ward admission", "Nursing and medical supervision", "Coordinated care with specialists"],
    relatedServiceSlugs: ["general-opd", "theatre"],
  },
  {
    slug: "pharmacy",
    name: "24/7 Pharmacy",
    shortDescription: "Round-the-clock dispensing of prescribed medication on-site.",
    category: "Primary & General Care",
    icon: "Pill",
    image: "/images/hospital/pharmacy-stock.jpg",
    imageAlt: "Pharmacy professional organising medicines on shelves",
    featured: true,
    covers: ["Prescription dispensing", "Medication guidance from pharmacy staff"],
    relatedServiceSlugs: ["general-opd"],
  },
  {
    slug: "home-care",
    name: "Home Care Services",
    shortDescription: "Hospital-coordinated care support for patients in their own homes.",
    category: "Primary & General Care",
    icon: "Home",
    image: "/images/hospital/pharmacy-consultation.jpg",
    imageAlt: "Pharmacy professional assisting a patient",
    relatedServiceSlugs: ["general-opd", "telemedicine"],
  },
  {
    slug: "dietician",
    name: "Dietician",
    shortDescription: "Nutrition guidance and dietary planning support.",
    category: "Primary & General Care",
    icon: "Apple",
    relatedServiceSlugs: ["health-screening"],
  },
  {
    slug: "maternity-gynaecology",
    name: "Maternity & Gynaecology",
    shortDescription: "Care for women through pregnancy, childbirth, and gynaecological health.",
    category: "Women & Children",
    icon: "HeartPulse",
    image: "/images/hospital/maternity-consultation.jpg",
    imageAlt: "Healthcare professional speaking with a pregnant patient",
    featured: true,
    covers: ["Antenatal and postnatal care", "Gynaecological consultations", "Delivery support"],
    diagnostics: ["Ultrasound Scan", "CTG"],
    relatedServiceSlugs: ["paediatrics", "ultrasound-scan", "ctg"],
  },
  {
    slug: "paediatrics",
    name: "Paediatrics / Child Health",
    shortDescription: "Medical care focused on infants, children, and adolescents.",
    category: "Women & Children",
    icon: "Baby",
    featured: true,
    covers: ["Child health consultations", "Growth and development check-ups"],
    relatedServiceSlugs: ["maternity-gynaecology", "general-opd"],
  },
  {
    slug: "ent",
    name: "Ear, Nose & Throat Care",
    shortDescription: "Specialist care for ear, nose, and throat conditions.",
    category: "Specialist Care",
    icon: "Ear",
    featured: true,
    relatedServiceSlugs: ["general-opd", "health-screening"],
  },
  {
    slug: "dental",
    name: "Dental Services",
    shortDescription: "Oral health consultations and dental care.",
    category: "Specialist Care",
    icon: "Smile",
    featured: true,
    relatedServiceSlugs: ["general-opd"],
  },
  {
    slug: "eye-clinic",
    name: "Eye Clinic / Optometry",
    shortDescription: "Eye examinations and vision care.",
    category: "Specialist Care",
    icon: "Eye",
    relatedServiceSlugs: ["general-opd", "health-screening"],
  },
  {
    slug: "laboratory",
    name: "24/7 Laboratory",
    shortDescription: "Round-the-clock diagnostic laboratory testing.",
    category: "Diagnostics",
    icon: "FlaskConical",
    image: "/images/hospital/laboratory.jpg",
    imageAlt: "Laboratory professionals working with diagnostic equipment",
    featured: true,
    relatedServiceSlugs: ["general-opd", "health-screening"],
  },
  {
    slug: "ecg",
    name: "ECG",
    shortDescription: "Electrocardiogram testing to assess heart activity.",
    category: "Diagnostics",
    icon: "Activity",
    relatedServiceSlugs: ["health-screening"],
  },
  {
    slug: "ctg",
    name: "CTG",
    shortDescription: "Cardiotocography monitoring used in pregnancy care.",
    category: "Diagnostics",
    icon: "Activity",
    image: "/images/hospital/antenatal-care.jpg",
    imageAlt: "Healthcare professional discussing antenatal care with a pregnant patient",
    relatedServiceSlugs: ["maternity-gynaecology"],
  },
  {
    slug: "ultrasound-scan",
    name: "Ultrasound Scan",
    shortDescription: "Diagnostic imaging used across a range of clinical needs.",
    category: "Diagnostics",
    icon: "Waves",
    relatedServiceSlugs: ["maternity-gynaecology", "general-opd"],
  },
  {
    slug: "health-screening",
    name: "Health Screening Services",
    shortDescription: "Preventive screening packages covering key health indicators.",
    category: "Diagnostics",
    icon: "ClipboardCheck",
    relatedServiceSlugs: ["laboratory", "corporate-wellness"],
  },
  {
    slug: "physiotherapy",
    name: "Physiotherapy",
    shortDescription: "Rehabilitation support to restore movement and function.",
    category: "Treatment & Rehabilitation",
    icon: "Dumbbell",
    relatedServiceSlugs: ["general-opd"],
  },
  {
    slug: "theatre",
    name: "Theatre",
    shortDescription: "Surgical theatre services for operative care.",
    category: "Treatment & Rehabilitation",
    icon: "Scissors",
    relatedServiceSlugs: ["in-patient-services"],
  },
  {
    slug: "telemedicine",
    name: "Telemedicine / Online Consultations",
    shortDescription: "Speak with a healthcare professional remotely.",
    category: "Digital & Community Care",
    icon: "Video",
    featured: true,
    relatedServiceSlugs: ["general-opd", "home-care"],
  },
  {
    slug: "corporate-wellness",
    name: "Corporate Wellness Services",
    shortDescription: "Health screening and wellness programmes for organisations.",
    category: "Digital & Community Care",
    icon: "Building2",
    relatedServiceSlugs: ["health-screening"],
  },
];

export const serviceCategories = [
  "Primary & General Care",
  "Women & Children",
  "Specialist Care",
  "Diagnostics",
  "Treatment & Rehabilitation",
  "Digital & Community Care",
] as const;

export function getServiceBySlug(slug: string) {
  return services.find((s) => s.slug === slug);
}

export function getFeaturedServices() {
  return services.filter((s) => s.featured);
}

export function getRelatedServices(service: Service) {
  return (service.relatedServiceSlugs ?? [])
    .map((slug) => getServiceBySlug(slug))
    .filter((s): s is Service => Boolean(s));
}
