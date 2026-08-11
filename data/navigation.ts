import type { NavItem } from "@/types";

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "All Medical Services", href: "/services" },
      { label: "General OPD", href: "/services/general-opd" },
      { label: "In-Patient Care", href: "/services/in-patient-services" },
      { label: "Maternity & Gynaecology", href: "/services/maternity-gynaecology" },
      { label: "Paediatrics", href: "/services/paediatrics" },
      { label: "ENT", href: "/services/ent" },
      { label: "Dental", href: "/services/dental" },
      { label: "Eye Clinic", href: "/services/eye-clinic" },
      { label: "Physiotherapy", href: "/services/physiotherapy" },
      { label: "Diagnostics", href: "/services/health-screening" },
      { label: "Laboratory", href: "/services/laboratory" },
      { label: "Pharmacy", href: "/services/pharmacy" },
      { label: "Telemedicine", href: "/services/telemedicine" },
      { label: "Health Screening", href: "/screening" },
    ],
  },
  { label: "Doctors", href: "/doctors" },
  { label: "Insurance", href: "/insurance" },
  { label: "Patient Resources", href: "/patient-resources" },
  { label: "Contact", href: "/contact" },
];

export const footerQuickLinks: NavItem[] = [
  { label: "About Us", href: "/about" },
  { label: "Doctors", href: "/doctors" },
  { label: "Book Appointment", href: "/appointments" },
  { label: "Telemedicine", href: "/telemedicine" },
  { label: "Health Screening", href: "/screening" },
  { label: "Corporate Wellness", href: "/corporate-wellness" },
  { label: "Health Articles", href: "/health" },
  { label: "Careers", href: "/careers" },
  { label: "Directions", href: "/directions" },
];

export const footerLegalLinks: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];
