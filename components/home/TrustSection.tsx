import { ArrowDownRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function TrustSection() {
  return (
    <section className="py-24 sm:py-36">
      <Container className="grid gap-10 lg:grid-cols-[1fr_2.1fr] lg:gap-20">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-deep">Why SGH</span>
          <ArrowDownRight className="mt-6 h-8 w-8 text-pink-accent" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-text-dark sm:text-6xl lg:text-8xl">
            Healthcare
            <span className="block text-purple-deep">designed</span>
            <span className="block">around you.</span>
          </h2>
          <p className="mt-8 max-w-2xl text-base leading-8 text-text-body sm:text-lg">
            Accessible, coordinated care should feel clear and human. Satellite General Hospital brings general,
            specialist and diagnostic services together for individuals, families and organisations.
          </p>
        </div>
      </Container>
    </section>
  );
}
