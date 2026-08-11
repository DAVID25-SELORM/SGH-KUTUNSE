import type { Metadata } from "next";
import { ClipboardList, ShieldCheck, CalendarCheck, Stethoscope, Video, HelpCircle, FileText } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PageHero } from "@/components/shared/PageHero";
import { FAQ } from "@/components/shared/FAQ";
import { CTASection } from "@/components/shared/CTASection";
import { faqs } from "@/data/faqs";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Patient Resources",
  description: `Resources to help you prepare for your visit to ${HOSPITAL.name}, including insurance, appointments and FAQs.`,
  path: "/patient-resources",
});

const resources = [
  { icon: ClipboardList, title: "Preparing for Your Visit", href: "/appointments", description: "What to bring and how to prepare for your hospital visit." },
  { icon: ShieldCheck, title: "Insurance Information", href: "/insurance", description: "Learn which insurance partners we work with and how to verify coverage." },
  { icon: CalendarCheck, title: "Appointment Information", href: "/appointments", description: "How to book, and what happens after you submit a request." },
  { icon: Stethoscope, title: "Health Screening", href: "/screening", description: "Explore our preventive health screening packages." },
  { icon: Video, title: "Telemedicine", href: "/telemedicine", description: "How online consultations work at Satellite General Hospital." },
  { icon: FileText, title: "Patient Forms", href: "/contact", description: "Contact us for any patient forms you may need before your visit." },
];

export default function PatientResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Patient Resources"
        description="Helpful information to guide you before, during and after your visit to Satellite General Hospital."
        crumbs={[{ label: "Patient Resources" }]}
      />

      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map(({ icon: Icon, title, href, description }) => (
              <Card key={title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-text-dark">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-body">{description}</p>
                <a href={href} className="mt-4 inline-block text-sm font-semibold text-purple-deep hover:text-purple-dark">
                  Learn more →
                </a>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-neutral-light py-20 sm:py-24">
        <Container>
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-purple-deep" aria-hidden="true" />
            <h2 className="text-2xl font-semibold tracking-tight text-text-dark">Frequently Asked Questions</h2>
          </div>
          <div className="mt-8">
            <FAQ items={faqs} />
          </div>
        </Container>
      </section>

      <CTASection />
    </>
  );
}
