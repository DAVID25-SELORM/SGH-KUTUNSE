import { Building2, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function CorporateTeaser() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="flex flex-col items-center gap-8 rounded-4xl bg-purple-dark px-8 py-14 text-center text-white sm:px-14">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
          <Building2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold sm:text-3xl">Corporate Wellness for Your Organisation</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-base">
            Health screening, staff wellness programmes and workplace health education, coordinated with your
            hospital.
          </p>
        </div>
        <Button href="/corporate-wellness" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-purple-dark">
          Request Corporate Wellness Proposal
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Container>
    </section>
  );
}
