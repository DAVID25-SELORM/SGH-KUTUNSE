import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { insurers } from "@/data/insurers";

export function InsuranceStrip() {
  return (
    <section className="bg-neutral-light py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Insurance"
          title="We Accept Major Health Insurance Plans"
          description="Satellite General Hospital partners with a range of insurers. Coverage depends on your specific policy — please verify before your visit."
          align="center"
          className="mx-auto"
        />

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {insurers.map((insurer) => (
            <span
              key={insurer.name}
              className="rounded-full border border-border-default bg-white px-4 py-2 text-sm font-medium text-text-body"
            >
              {insurer.name}
            </span>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button href="/insurance" variant="outline">
            Verify Your Insurance
          </Button>
        </div>
      </Container>
    </section>
  );
}
