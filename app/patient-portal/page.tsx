import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/shared/PageHero";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Patient Portal",
  description: `Patient service and appointment support from ${HOSPITAL.name}.`,
  path: "/patient-portal",
});

export default function PatientPortalPage() {
  return (
    <>
      <PageHero eyebrow="Patient Portal" title="Patient Portal" crumbs={[{ label: "Patient Portal" }]} />
      <section className="py-20 sm:py-24">
        <Container className="mx-auto max-w-lg text-center">
          <Card>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
              <LayoutDashboard className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-text-dark">Patient Support</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-body">
              To request an appointment or receive help with hospital services, use the options below. A hospital
              representative will assist you directly.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button href="/appointments">Book Appointment</Button>
              <Button href="/contact" variant="outline">
                Contact Us
              </Button>
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
}
