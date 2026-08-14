import Link from "next/link";
import { Phone, MapPin, Clock } from "lucide-react";
import { HOSPITAL } from "@/lib/constants";
import { footerQuickLinks, footerLegalLinks } from "@/data/navigation";
import { services } from "@/data/services";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/layout/Logo";

const footerServices = services.slice(0, 8);

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-default bg-purple-dark text-white/90">
      <Container className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Logo variant="light" />
          <p className="text-sm leading-relaxed text-white/70">{HOSPITAL.tagline}</p>
          <p className="text-sm leading-relaxed text-white/70">
            Comprehensive, 24/7 healthcare for individuals, families and organisations at Satellite General
            Hospital.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Quick Links</h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {footerQuickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-11 items-center py-2 text-sm text-white/70 hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Medical Services</h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {footerServices.map((service) => (
              <li key={service.slug}>
                <Link href={`/services/${service.slug}`} className="inline-flex min-h-11 items-center py-2 text-sm text-white/70 hover:text-white">
                  {service.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/services" className="inline-flex min-h-11 items-center py-2 text-sm font-medium text-white hover:text-white/80">
                View All Services →
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Contact</h3>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-white/70">
            <li className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              {HOSPITAL.hours}
            </li>
            {HOSPITAL.phones.map((phone, i) => (
              <li key={phone} className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`tel:${HOSPITAL.phonesTel[i]}`} className="inline-flex min-h-11 items-center py-2 hover:text-white">
                  {phone}
                </a>
              </li>
            ))}
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {HOSPITAL.address}
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 text-xs text-white/60 sm:flex-row">
          <p>
            &copy; {year} {HOSPITAL.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {footerLegalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center py-2 hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </footer>
  );
}
