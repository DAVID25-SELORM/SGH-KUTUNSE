import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const stories = [
  {
    eyebrow: "Everything You Need",
    title: "From consultation to follow-up, care stays connected.",
    description:
      "Start with a consultation, access on-site diagnostics and collect prescribed medication without navigating care alone. Our services are designed to support a clearer patient journey under one roof.",
    href: "/services",
    cta: "Explore our services",
    image: "/images/telemedicine/connected-care.png",
    imageAlt: "Connected care through consultation, diagnostics, treatment and follow-up",
  },
  {
    eyebrow: "Care Beyond the Hospital",
    title: "Healthcare that meets you where you are.",
    description:
      "Request an online consultation when travelling to the hospital is not convenient. The hospital confirms availability before sharing the next steps for your consultation.",
    href: "/telemedicine",
    cta: "Request online consultation",
    image: "/images/telemedicine/online-consultations.jpeg",
    imageAlt: "Online consultation and connected care service",
  },
];

export function CareStories() {
  return (
    <section className="overflow-hidden py-24 sm:py-32">
      <Container className="space-y-24 sm:space-y-32">
        {stories.map(({ eyebrow, title, description, href, cta, image, imageAlt }, index) => (
          <article key={title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <div className={index % 2 ? "lg:order-2" : undefined}>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-deep">{eyebrow}</span>
              <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-text-dark sm:text-5xl lg:text-6xl">
                {title}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-text-body sm:text-lg">{description}</p>
              <Button href={href} variant="outline" size="lg" className="mt-8">
                {cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <div className={`relative min-h-[360px] overflow-hidden rounded-3xl bg-bg-soft sm:min-h-[480px] sm:rounded-[32px] lg:min-h-[540px] ${index % 2 ? "lg:order-1" : ""}`}>
              <Image
                src={image}
                alt={imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </article>
        ))}
      </Container>
    </section>
  );
}
