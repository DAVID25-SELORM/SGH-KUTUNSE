import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { Alert } from "@/components/ui/Alert";
import { InsuranceVerificationForm } from "@/components/forms/InsuranceVerificationForm";
import { insurers } from "@/data/insurers";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Insurance",
  description: `See the insurance partners accepted at ${HOSPITAL.name} and verify your coverage before your visit.`,
  path: "/insurance",
});

export default function InsurancePage() {
  return (
    <>
      <PageHero
        eyebrow="Insurance"
        title="We Accept Major Health Insurance Plans"
        description="Satellite General Hospital partners with a range of insurers to make care more accessible."
        crumbs={[{ label: "Insurance" }]}
      />

      <section className="py-16 sm:py-20">
        <Container>
          <Alert variant="info" title="Please confirm your eligibility before your visit.">
            Insurance coverage depends on your specific policy and the service required. Please contact the
            hospital or your insurer to confirm eligibility before your visit.
          </Alert>

          <div className="mt-10 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {insurers.map((insurer) => (
              <Card key={insurer.name} className="flex items-center justify-center py-6 text-center">
                <span className="text-sm font-semibold text-text-dark">{insurer.name}</span>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-neutral-light py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-purple-deep">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <SectionHeading className="mt-5" title="Verify Your Insurance" description="Send us your details and we'll help confirm your coverage before your appointment." />
          </div>
          <Card className="lg:col-span-2">
            <InsuranceVerificationForm />
          </Card>
        </Container>
      </section>
    </>
  );
}
