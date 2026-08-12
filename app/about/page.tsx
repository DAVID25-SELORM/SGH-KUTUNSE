import type { Metadata } from "next";
import Image from "next/image";
import { HeartHandshake, ShieldCheck, Users2, Clock, Sparkles, Accessibility } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { PageHero } from "@/components/shared/PageHero";
import { CTASection } from "@/components/shared/CTASection";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "About Us",
  description: `Learn about ${HOSPITAL.name}, our philosophy of friendly healthcare and premium patient experience, and our 24/7 service commitment in Kuntunse, Ghana.`,
  path: "/about",
});

const values = [
  { icon: HeartHandshake, title: "Compassion", description: "Treating every patient with empathy and respect." },
  { icon: ShieldCheck, title: "Professionalism", description: "Delivering care with clinical diligence and integrity." },
  { icon: Sparkles, title: "Safety", description: "Prioritising patient safety in every part of the care process." },
  { icon: Users2, title: "Respect", description: "Honouring every patient's dignity, background and needs." },
  { icon: Clock, title: "Excellence", description: "Striving for consistent, high-quality care around the clock." },
  { icon: Accessibility, title: "Accessibility", description: "Making healthcare approachable for the community we serve." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Friendly Healthcare, Premium Experience"
        description={`${HOSPITAL.name} is committed to providing accessible, coordinated healthcare for individuals, families and organisations, 24 hours a day.`}
        crumbs={[{ label: "About" }]}
      />

      <section className="py-20 sm:py-24">
        <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Our Story" title="Healthcare Built Around Our Community" />
            <p className="mt-5 text-sm leading-relaxed text-text-body sm:text-base">
              Satellite General Hospital serves the Kuntunse Satellite community and surrounding areas with
              round-the-clock general and specialist healthcare services. Our team is focused on making quality
              care accessible, coordinated and comfortable for every patient who walks through our doors.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-text-body sm:text-base">
              Detailed hospital history and milestones will be added here as they are confirmed.
            </p>
          </div>
          <figure>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-bg-soft">
              <Image
                src="/images/hospital/patient-consultation.jpg"
                alt="Healthcare professional speaking with a patient"
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-xs leading-relaxed text-text-muted">
              Patient consultation at Satellite General Hospital.
            </figcaption>
          </figure>
        </Container>
      </section>

      <section className="bg-neutral-light py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Our Approach"
            title="Our Philosophy of Care"
            description="Every interaction at Satellite General Hospital is guided by our commitment to friendly, professional and coordinated patient care — available 24/7."
          />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold text-text-dark">Our Approach to Patient Care</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-body">
                We coordinate general, specialist and diagnostic services so patients receive joined-up care in
                one place, guided by our clinical team.
              </p>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-text-dark">24/7 Service Commitment</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-body">
                Our OPD, laboratory and pharmacy operate around the clock, so essential care is available whenever
                it&apos;s needed.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow="Our Values" title="What Guides Our Care" align="center" className="mx-auto" />
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map(({ icon: Icon, title, description }) => (
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

      <CTASection />
    </>
  );
}
