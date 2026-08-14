import type { Metadata } from "next";
import Image from "next/image";
import { MessageSquare, CalendarCheck, Link2, Video, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PageHero } from "@/components/shared/PageHero";
import { CTASection } from "@/components/shared/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";
import { TelemedicineRequestForm } from "@/components/forms/TelemedicineRequestForm";

export const metadata: Metadata = buildMetadata({
  title: "Telemedicine",
  description: `Request an online consultation with a healthcare professional at ${HOSPITAL.name}.`,
  path: "/telemedicine",
});

const steps = [
  { icon: MessageSquare, title: "Send a Request", description: "Ask our team to contact you about an online consultation." },
  { icon: CalendarCheck, title: "Hospital Confirms Appointment", description: "A hospital representative confirms your appointment time." },
  { icon: Link2, title: "Receive Consultation Link", description: "You'll receive details to join your remote consultation." },
  { icon: Video, title: "Speak with a Healthcare Professional", description: "Connect remotely with a member of our clinical team." },
];

export default function TelemedicinePage() {
  return (
    <>
      <PageHero
        eyebrow="Digital Care"
        title="Telemedicine & Online Consultations"
        description="Speak with a healthcare professional remotely, without needing to visit the hospital in person for every concern."
        crumbs={[{ label: "Telemedicine" }]}
      />

      <section className="py-20 sm:py-24">
        <Container>
          <div className="relative mb-12 aspect-[3/2] overflow-hidden rounded-3xl bg-bg-soft">
            <Image src="/images/telemedicine/video-consultation.png" alt="Patient taking part in an online consultation from home" fill sizes="(max-width: 1280px) 100vw, 1200px" className="object-cover" preload />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, description }, i) => (
              <Card key={title} className="relative">
                <span className="text-xs font-semibold text-border-default">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-text-dark">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-body">{description}</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Button href={`tel:${HOSPITAL.phonesTel[0]}`} size="lg">
              Call to Request a Consultation
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <Card className="mx-auto mt-12 max-w-2xl"><h2 className="mb-6 text-2xl font-semibold text-purple-deep">Request telemedicine contact</h2><TelemedicineRequestForm /></Card>
        </Container>
      </section>

      <CTASection
        title="Not sure if telemedicine is right for you?"
        description="Call the hospital and our team can help you decide whether an in-person or online consultation is best."
      />
    </>
  );
}
