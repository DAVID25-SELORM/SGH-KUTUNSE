import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHero } from "@/components/shared/PageHero";
import { ServiceCard } from "@/components/services/ServiceCard";
import { getServiceBySlug, getRelatedServices, services } from "@/data/services";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return {};
  return buildMetadata({
    title: service.name,
    description: service.shortDescription,
    path: `/services/${service.slug}`,
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const related = getRelatedServices(service);

  return (
    <>
      <PageHero
        eyebrow={service.category}
        title={service.name}
        description={service.shortDescription}
        crumbs={[{ label: "Services", href: "/services" }, { label: service.name }]}
      />

      <section className="py-20 sm:py-24">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="flex flex-col gap-10 lg:col-span-2">
            {service.image ? (
              <figure>
                <div className="relative aspect-[3/2] overflow-hidden rounded-3xl bg-bg-soft">
                  <Image
                    src={service.image}
                    alt={service.imageAlt ?? ""}
                    fill
                    unoptimized={service.image.startsWith("/images/hospital/")}
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className={`object-cover ${service.imagePosition ?? "object-center"}`}
                    preload
                  />
                </div>
                <figcaption className="mt-3 text-xs text-text-muted">Representative healthcare photography.</figcaption>
              </figure>
            ) : null}
            {service.covers && service.covers.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold text-text-dark">What This Service Covers</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {service.covers.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-text-body">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pink-accent" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {service.whenToSeekCare && service.whenToSeekCare.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold text-text-dark">When to Seek Care</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {service.whenToSeekCare.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-text-body">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pink-accent" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {service.whatToExpect && service.whatToExpect.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold text-text-dark">What to Expect</h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {service.whatToExpect.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-text-body">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pink-accent" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {service.diagnostics && service.diagnostics.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold text-text-dark">Related Diagnostics</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {service.diagnostics.map((item) => (
                    <span key={item} className="rounded-full border border-border-default bg-white px-3.5 py-1.5 text-sm text-text-body">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {!service.covers && !service.whenToSeekCare && !service.whatToExpect ? (
              <p className="text-sm leading-relaxed text-text-muted">
                Detailed information about this service is being finalised. Please contact the hospital directly
                for more information.
              </p>
            ) : null}
          </div>

          <Card className="h-fit lg:sticky lg:top-28">
            <h3 className="text-base font-semibold text-text-dark">Need this service?</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-body">
              Book an appointment online or call the hospital directly to discuss your needs.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Button href="/appointments" className="w-full">
                Book Appointment
              </Button>
              <Button href={`tel:${HOSPITAL.phonesTel[0]}`} variant="outline" className="w-full">
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call {HOSPITAL.phones[0]}
              </Button>
            </div>
          </Card>
        </Container>
      </section>

      {related.length > 0 ? (
        <section className="bg-neutral-light py-20 sm:py-24">
          <Container>
            <h2 className="text-2xl font-semibold tracking-tight text-text-dark">Related Services</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s) => (
                <ServiceCard key={s.slug} service={s} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
