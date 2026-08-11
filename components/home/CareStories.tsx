import { ArrowRight, Baby, FlaskConical, HeartPulse, Video } from "lucide-react";
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
    icon: HeartPulse,
    supportingIcon: FlaskConical,
    panelTitle: "Connected care",
    panelCopy: "Consultation. Diagnostics. Treatment. Follow-up.",
  },
  {
    eyebrow: "Care Beyond the Hospital",
    title: "Healthcare that meets you where you are.",
    description:
      "Request an online consultation when travelling to the hospital is not convenient. The hospital confirms availability before sharing the next steps for your consultation.",
    href: "/telemedicine",
    cta: "Request online consultation",
    icon: Video,
    supportingIcon: Baby,
    panelTitle: "Online consultations",
    panelCopy: "A simple request. A confirmed time. Professional care.",
  },
];

export function CareStories() {
  return (
    <section className="overflow-hidden py-24 sm:py-32">
      <Container className="space-y-24 sm:space-y-32">
        {stories.map(({ eyebrow, title, description, href, cta, icon: Icon, supportingIcon: SupportingIcon, panelTitle, panelCopy }, index) => (
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

            <div
              className={`group relative min-h-[360px] overflow-hidden rounded-3xl p-6 sm:min-h-[480px] sm:rounded-[32px] sm:p-10 lg:min-h-[540px] lg:p-12 ${
                index % 2 ? "bg-purple-dark text-white lg:order-1" : "bg-bg-soft text-text-dark"
              }`}
            >
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pink-accent/15 blur-3xl transition-transform duration-700 group-hover:scale-125" />
              <div className="relative flex h-full min-h-[312px] flex-col justify-between sm:min-h-[400px] lg:min-h-[444px]">
                <span className={`flex h-16 w-16 items-center justify-center rounded-3xl ${index % 2 ? "bg-white/10" : "bg-white text-purple-deep shadow-sm"}`}>
                  <Icon className="h-8 w-8" aria-hidden="true" />
                </span>
                <div>
                  <SupportingIcon className={`mb-6 h-24 w-24 transition-transform duration-700 group-hover:scale-110 ${index % 2 ? "text-white/10" : "text-purple-deep/10"}`} aria-hidden="true" />
                  <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{panelTitle}</p>
                  <p className={`mt-3 max-w-sm text-base leading-relaxed ${index % 2 ? "text-white/70" : "text-text-body"}`}>{panelCopy}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </Container>
    </section>
  );
}
