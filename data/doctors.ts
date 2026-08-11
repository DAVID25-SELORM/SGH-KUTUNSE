import type { Doctor } from "@/types";

// DEMO DATA: These are placeholder profiles for layout/design purposes only.
// They do not represent real Satellite General Hospital staff.
// Replace with verified staff records before launch.
export const doctors: Doctor[] = [
  {
    slug: "demo-general-medicine-1",
    fullName: "Dr. Demo Practitioner",
    specialty: "General Medicine",
    role: "General Medical Officer",
    bio: "Placeholder bio for a general medicine practitioner. Replace with verified staff biography.",
    availability: "Mon–Sat, OPD hours",
    photo: "/images/doctors/demo-placeholder.svg",
    isDemoData: true,
  },
  {
    slug: "demo-gynaecology-1",
    fullName: "Dr. Demo Gynaecologist",
    specialty: "Gynaecology",
    role: "Obstetrics & Gynaecology",
    bio: "Placeholder bio for a gynaecology specialist. Replace with verified staff biography.",
    availability: "By appointment",
    photo: "/images/doctors/demo-placeholder.svg",
    isDemoData: true,
  },
  {
    slug: "demo-paediatrics-1",
    fullName: "Dr. Demo Paediatrician",
    specialty: "Paediatrics",
    role: "Child Health Specialist",
    bio: "Placeholder bio for a paediatric specialist. Replace with verified staff biography.",
    availability: "Mon–Fri, OPD hours",
    photo: "/images/doctors/demo-placeholder.svg",
    isDemoData: true,
  },
  {
    slug: "demo-ent-1",
    fullName: "Dr. Demo ENT Specialist",
    specialty: "ENT",
    role: "Ear, Nose & Throat Specialist",
    bio: "Placeholder bio for an ENT specialist. Replace with verified staff biography.",
    availability: "By appointment",
    photo: "/images/doctors/demo-placeholder.svg",
    isDemoData: true,
  },
  {
    slug: "demo-dental-1",
    fullName: "Dr. Demo Dentist",
    specialty: "Dental",
    role: "Dental Surgeon",
    bio: "Placeholder bio for a dental surgeon. Replace with verified staff biography.",
    availability: "Mon–Sat, by appointment",
    photo: "/images/doctors/demo-placeholder.svg",
    isDemoData: true,
  },
  {
    slug: "demo-eye-1",
    fullName: "Dr. Demo Optometrist",
    specialty: "Eye",
    role: "Optometrist",
    bio: "Placeholder bio for an eye care specialist. Replace with verified staff biography.",
    availability: "By appointment",
    photo: "/images/doctors/demo-placeholder.svg",
    isDemoData: true,
  },
  {
    slug: "demo-physiotherapy-1",
    fullName: "Dr. Demo Physiotherapist",
    specialty: "Physiotherapy",
    role: "Physiotherapist",
    bio: "Placeholder bio for a physiotherapist. Replace with verified staff biography.",
    availability: "Mon–Fri, by appointment",
    photo: "/images/doctors/demo-placeholder.svg",
    isDemoData: true,
  },
];

export const doctorSpecialtyFilters = [
  "All",
  "General Medicine",
  "Gynaecology",
  "Paediatrics",
  "ENT",
  "Dental",
  "Eye",
  "Physiotherapy",
  "Other",
] as const;

export function getDoctorBySlug(slug: string) {
  return doctors.find((d) => d.slug === slug);
}
