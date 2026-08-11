import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/services/ServiceCard";
import { services } from "@/data/services";

const featuredSlugs = ["general-opd", "maternity-gynaecology", "laboratory", "pharmacy", "telemedicine"];

export function FeaturedServices() {
  const featured = featuredSlugs.flatMap((slug) => {
    const service = services.find((item) => item.slug === slug);
    return service ? [service] : [];
  });

  return (
    <section className="bg-neutral-light py-24 sm:py-32">
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Essential Care"
            title="Care for everyday health and life's important moments."
            description="Five frequently needed services, with the full hospital offering always one step away."
            className="max-w-3xl"
          />
          <Button href="/services" variant="outline" className="shrink-0">
            View All Services
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {featured.map((service, index) => (
            <div key={service.slug} className={index < 2 ? "lg:col-span-3" : "lg:col-span-2"}>
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs leading-relaxed text-text-muted">
          Service photography is representative and does not depict Satellite General Hospital staff or patients.
        </p>
      </Container>
    </section>
  );
}
