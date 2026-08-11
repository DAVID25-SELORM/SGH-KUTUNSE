import type { Metadata } from "next";
import { ClipboardCheck, Users, GraduationCap, ShieldCheck, Building2, Handshake } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { CorporateEnquiryForm } from "@/components/forms/CorporateEnquiryForm";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Corporate Wellness",
  description: `Corporate health screening and wellness programmes for organisations, offered by ${HOSPITAL.name}.`,
  path: "/corporate-wellness",
});

const offerings = [
  { icon: ClipboardCheck, title: "Corporate Health Screening", description: "Screening programmes tailored for teams and organisations." },
  { icon: Users, title: "Staff Wellness Programmes", description: "Ongoing wellness support designed around your workforce." },
  { icon: GraduationCap, title: "Workplace Health Education", description: "Health education sessions delivered to your organisation." },
  { icon: ShieldCheck, title: "Health Risk Assessments", description: "Assessments to help identify and manage workplace health risks." },
  { icon: Building2, title: "On-site or Hospital-based Screening", description: "Flexible screening delivery at your premises or ours." },
  { icon: Handshake, title: "Corporate Partnerships", description: "Long-term partnerships to support organisational health goals." },
];

export default function CorporateWellnessPage() {
  return (
    <>
      <PageHero
        eyebrow="For Organisations"
        title="Corporate Wellness Services"
        description="Health screening and wellness programmes designed to support your organisation and its people."
        crumbs={[{ label: "Corporate Wellness" }]}
      />

      <section className="py-20 sm:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offerings.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-text-dark">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-body">{description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-neutral-light py-20 sm:py-24">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div>
            <SectionHeading
              eyebrow="Get Started"
              title="Request a Corporate Wellness Proposal"
              description="Tell us about your organisation and what you're looking for, and our team will follow up."
            />
          </div>
          <Card className="lg:col-span-2">
            <CorporateEnquiryForm />
          </Card>
        </Container>
      </section>
    </>
  );
}
