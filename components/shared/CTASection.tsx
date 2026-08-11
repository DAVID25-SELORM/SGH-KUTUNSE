import { Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { HOSPITAL } from "@/lib/constants";

export function CTASection({
  title = "Ready to see a doctor?",
  description = "Book an appointment online and a hospital representative will contact you to confirm availability.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="bg-bg-soft py-16 sm:py-20">
      <Container className="flex flex-col items-center gap-6 text-center">
        <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-text-dark sm:text-3xl">{title}</h2>
        <p className="max-w-lg text-sm leading-relaxed text-text-body sm:text-base">{description}</p>
        <div className="flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <Button href="/appointments" className="w-full sm:w-auto">Book Appointment</Button>
          <Button href={`tel:${HOSPITAL.phonesTel[0]}`} variant="outline" className="w-full sm:w-auto">
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call Hospital
          </Button>
        </div>
      </Container>
    </section>
  );
}
