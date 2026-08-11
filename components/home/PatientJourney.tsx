import { CalendarCheck, ClipboardPenLine, Stethoscope, FlaskConical, Pill, RefreshCw } from "lucide-react";
import { Container } from "@/components/ui/Container";

const steps = [
  { title: "Request", description: "Book online or call the hospital.", icon: CalendarCheck },
  { title: "Arrive", description: "Check in and complete registration.", icon: ClipboardPenLine },
  { title: "Consult", description: "Meet the appropriate healthcare professional.", icon: Stethoscope },
  { title: "Diagnose", description: "Access laboratory or diagnostic services if required.", icon: FlaskConical },
  { title: "Treat", description: "Receive your care plan and prescribed medication.", icon: Pill },
  { title: "Follow up", description: "Continue care with the next steps provided to you.", icon: RefreshCw },
];

export function PatientJourney() {
  return (
    <section className="bg-neutral-light py-24 sm:py-32">
      <Container>
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-deep">Your Visit</span>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.035em] text-text-dark sm:text-5xl lg:text-6xl">
            A clearer path through care.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-text-body sm:text-lg">
            Every visit is different. This simple journey helps first-time patients understand what may happen from appointment request to follow-up.
          </p>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-[28px] bg-border-default sm:grid-cols-2 lg:grid-cols-3">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <li key={title} className="group bg-white p-7 transition-colors duration-300 hover:bg-bg-soft sm:p-8">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep transition-transform duration-300 group-hover:-translate-y-1">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold tracking-[0.18em] text-text-muted">0{index + 1}</span>
              </div>
              <h3 className="mt-8 text-xl font-semibold text-text-dark">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-body">{description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
