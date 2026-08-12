import type { Metadata } from "next";
import { Phone, Stethoscope } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { CTASection } from "@/components/shared/CTASection";
import { DoctorsDirectory } from "@/components/doctors/DoctorsDirectory";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { specialties } from "@/data/doctors";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";
import { getPublishedDoctors } from "@/lib/server/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Doctors & Specialists",
  description: `Explore clinical specialties available at ${HOSPITAL.name}. Verified clinician profiles are published after hospital approval.`,
  path: "/doctors",
});

export default async function DoctorsPage() {
  const doctors = await getPublishedDoctors();
  return (
    <>
      <PageHero eyebrow="Our Team" title="Doctors & Specialists" description="Explore our clinical specialties and verified medical team profiles." crumbs={[{ label: "Doctors" }]} />
      <section className="py-16 sm:py-20">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-pink-accent">Meet Our Medical Team</p>
            <h2 className="mt-3 text-3xl font-semibold text-purple-deep">Patient-centred care across our specialties</h2>
            <p className="mt-4 leading-relaxed text-text-body">Our clinical team provides patient-centred care across a range of medical specialties. Doctor profiles and clinic schedules are displayed as verified information becomes available.</p>
          </div>
        </Container>
      </section>
      {doctors.length > 0 ? <DoctorsDirectory doctors={doctors} /> : null}
      <section className="bg-neutral-light py-16 sm:py-20">
        <Container>
          <h2 className="text-2xl font-semibold text-purple-deep">Clinical specialties</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {specialties.map((specialty) => (
              <article key={specialty.name} className="flex flex-col rounded-3xl border border-border-default bg-white p-6 shadow-sm">
                <Stethoscope className="h-8 w-8 text-purple-deep" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold text-text-dark">{specialty.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-text-body">{specialty.description}</p>
                <p className="mt-4 text-sm text-text-muted"><strong>Availability:</strong> Contact the hospital for clinic schedule.</p>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button href="/appointments" size="sm" className="flex-1">Book Appointment</Button>
                  <Button href={`tel:${HOSPITAL.phonesTel[0]}`} variant="outline" size="sm" className="flex-1"><Phone className="h-4 w-4" aria-hidden="true" />Call Hospital</Button>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <CTASection />
    </>
  );
}
