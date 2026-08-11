import { Phone, MapPin, Clock } from "lucide-react";
import { HOSPITAL } from "@/lib/constants";
import { Container } from "@/components/ui/Container";

export function UtilityBar() {
  return (
    <div className="hidden bg-purple-dark text-white sm:block">
      <Container className="flex h-9 items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-medium">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{HOSPITAL.hours}</span>
        </div>
        <div className="flex items-center gap-5">
          <a href={`tel:${HOSPITAL.phonesTel[0]}`} className="flex items-center gap-1.5 hover:text-white/80">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {HOSPITAL.phones[0]}
          </a>
          <a
            href="/directions"
            className="hidden items-center gap-1.5 hover:text-white/80 md:flex"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {HOSPITAL.address}
          </a>
        </div>
      </Container>
    </div>
  );
}
