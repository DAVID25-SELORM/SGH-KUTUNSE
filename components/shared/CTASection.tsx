import { MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { HOSPITAL } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";

export function CTASection({
  title = "Ready to see a doctor?",
  description = "Request an appointment online and we will confirm within 30 minutes, 24/7.",
  whatsappMessage,
}: {
  title?: string;
  description?: string;
  whatsappMessage?: string;
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
          <Button href={whatsappLink(whatsappMessage)} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto bg-[#25D366] text-white hover:bg-[#1ebe5b] border-transparent">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp Us
          </Button>
        </div>
      </Container>
    </section>
  );
}
