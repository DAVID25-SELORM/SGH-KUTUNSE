import { ArrowRight, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { HOSPITAL } from "@/lib/constants";

export function AppointmentCTA() {
  return (
    <section className="bg-white py-8 sm:py-12">
      <Container>
        <div className="relative overflow-hidden rounded-[32px] bg-purple-dark px-6 py-20 text-center text-white sm:px-12 sm:py-28">
          <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-pink-accent/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-purple-deep blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Open 24/7</span>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Need medical care?</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              Our healthcare professionals are available around the clock. Request an appointment or call the hospital directly.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/appointments" size="lg">
                Book Appointment
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button href={`tel:${HOSPITAL.phonesTel[0]}`} variant="outline" size="lg" className="border-white/30 bg-transparent text-white hover:bg-white hover:text-purple-dark">
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call Hospital
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
