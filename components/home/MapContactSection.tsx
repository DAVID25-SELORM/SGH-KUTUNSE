import { Phone, Clock, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MapSection } from "@/components/shared/MapSection";
import { HOSPITAL } from "@/lib/constants";

export function MapContactSection() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow="Visit Us" title="Find & Contact Satellite General Hospital" />
          <ul className="mt-6 flex flex-col gap-4">
            <li className="flex items-center gap-3 text-sm text-text-body">
              <Clock className="h-4 w-4 text-purple-deep" aria-hidden="true" />
              {HOSPITAL.hours}
            </li>
            {HOSPITAL.phones.map((phone, i) => (
              <li key={phone} className="flex items-center gap-3 text-sm text-text-body">
                <Phone className="h-4 w-4 text-purple-deep" aria-hidden="true" />
                <a href={`tel:${HOSPITAL.phonesTel[i]}`} className="hover:text-purple-deep">
                  {phone}
                </a>
              </li>
            ))}
            <li className="flex items-start gap-3 text-sm text-text-body">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-purple-deep" aria-hidden="true" />
              {HOSPITAL.address}
            </li>
          </ul>
        </div>
        <MapSection />
      </Container>
    </section>
  );
}
