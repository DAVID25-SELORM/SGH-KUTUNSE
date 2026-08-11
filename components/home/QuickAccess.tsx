import Link from "next/link";
import { Stethoscope, FlaskConical, Pill, Calendar, MapPin, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

const items = [
  { label: "24/7 OPD", description: "Walk-in outpatient care", href: "/services/general-opd", icon: Stethoscope },
  { label: "Laboratory", description: "Round-the-clock testing", href: "/services/laboratory", icon: FlaskConical },
  { label: "Pharmacy", description: "On-site dispensing", href: "/services/pharmacy", icon: Pill },
  { label: "Book Appointment", description: "Request a visit", href: "/appointments", icon: Calendar },
  { label: "Get Directions", description: "Find the hospital", href: "/directions", icon: MapPin },
];

export function QuickAccess() {
  return (
    <div className="relative z-10 -mt-10 sm:-mt-12">
      <Container>
        <div className="grid grid-cols-1 gap-2 rounded-3xl border border-border-default bg-white p-3 shadow-[0_20px_60px_-20px_rgba(32,33,42,0.2)] min-[380px]:grid-cols-2 sm:p-5 lg:grid-cols-5 lg:gap-4">
          {items.map(({ label, description, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="group flex min-h-24 flex-col items-start gap-3 rounded-2xl p-4 transition-colors hover:bg-bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep group-hover:bg-white">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="flex items-center gap-1 text-sm font-semibold text-text-dark">
                  {label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                </span>
                <span className="mt-0.5 block text-xs text-text-muted">{description}</span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
