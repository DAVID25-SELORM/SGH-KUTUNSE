import type { FAQItem } from "@/types";
import { HOSPITAL } from "@/lib/constants";

export const faqs: FAQItem[] = [
  {
    category: "Appointments",
    question: "How do I book an appointment?",
    answer:
      `Submit a request on our Appointments page, or call ${HOSPITAL.phones[0]} or ${HOSPITAL.phones[1]}. A hospital representative will contact you to confirm your appointment time.`,
  },
  {
    category: "Appointments",
    question: "Is my appointment confirmed once I submit the form?",
    answer:
      "No appointment is confirmed online. Please call the hospital and speak with a representative to confirm availability and your appointment time.",
  },
  {
    category: "Insurance",
    question: "Does the hospital accept my insurance?",
    answer:
      "Satellite General Hospital partners with several insurers, listed on our Insurance page. Coverage depends on your specific policy, so please contact the hospital or your insurer to confirm eligibility before your visit.",
  },
  {
    category: "Visiting",
    question: "Is the hospital open 24/7?",
    answer: "Yes. Satellite General Hospital operates 24 hours a day, every day.",
  },
  {
    category: "Telemedicine",
    question: "How does an online consultation work?",
    answer:
      "You request a consultation, the hospital confirms your appointment, and you receive details to connect with a healthcare professional remotely.",
  },
  {
    category: "Visiting",
    question: "Where is the hospital located?",
    answer: "Satellite General Hospital is located at Kuntunse Satellite, Near Damax 2. See our Directions page for landmark-based directions.",
  },
];
