import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PageHero } from "@/components/shared/PageHero";
import { AppointmentForm } from "@/components/forms/AppointmentForm";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";
import { Phone, Clock, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = buildMetadata({
  title: "Book Appointment",
  description: `Request an appointment at ${HOSPITAL.name} in under a minute. We confirm within 30 minutes, 24/7.`,
  path: "/appointments",
});

export default function AppointmentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Appointments"
        title="Book an Appointment"
        description="Tell us who you are, what you need and when suits you. This is a request: we confirm by WhatsApp or phone within 30 minutes, 24/7."
        crumbs={[{ label: "Book Appointment" }]}
      />

      <section className="py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <AppointmentForm />
          </Card>

          <div className="flex flex-col gap-5">
            <Card>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-text-dark">Prefer to call?</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-body">
                Our OPD is open 24/7. Call us directly for urgent needs.
              </p>
              <a
                href={`tel:${HOSPITAL.phonesTel[0]}`}
                className="mt-4 flex items-center gap-2 text-sm font-semibold text-purple-deep hover:text-purple-dark"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                {HOSPITAL.phones[0]}
              </a>
            </Card>
            <Card>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-text-dark">Prefer WhatsApp?</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-body">Message us your name, what you need and the day you prefer.</p>
              <a href={whatsappLink("Hello SGH, I'd like to book an appointment.")} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center gap-2 text-sm font-semibold text-purple-deep hover:text-purple-dark">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {HOSPITAL.whatsappDisplay}
              </a>
            </Card>
            <Card className="bg-bg-soft">
              <p className="text-sm leading-relaxed text-text-body">
                For medical emergencies, please proceed directly to the hospital or call us immediately rather
                than submitting an online request.
              </p>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
