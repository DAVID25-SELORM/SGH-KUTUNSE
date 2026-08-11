import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/shared/PageHero";
import { CTASection } from "@/components/shared/CTASection";
import { ServiceCard } from "@/components/services/ServiceCard";
import { services, serviceCategories } from "@/data/services";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Our Medical Services",
  description: `Explore the full range of general, specialist, diagnostic and digital healthcare services available at ${HOSPITAL.name}.`,
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Services"
        title="Comprehensive Medical Services"
        description="From everyday general care to specialist and diagnostic services, explore what's available at Satellite General Hospital."
        crumbs={[{ label: "Services" }]}
      />

      <section className="py-20 sm:py-24">
        <Container className="flex flex-col gap-16">
          {serviceCategories.map((category) => {
            const categoryServices = services.filter((s) => s.category === category);
            if (categoryServices.length === 0) return null;
            return (
              <div key={category}>
                <h2 className="text-2xl font-semibold tracking-tight text-text-dark">{category}</h2>
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryServices.map((service) => (
                    <ServiceCard key={service.slug} service={service} />
                  ))}
                </div>
              </div>
            );
          })}
        </Container>
      </section>

      <CTASection />
    </>
  );
}
