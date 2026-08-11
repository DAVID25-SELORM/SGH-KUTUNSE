import { Phone, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { HOSPITAL } from "@/lib/constants";

const actions = [
  { label: "Call", icon: Phone, href: `tel:${HOSPITAL.phonesTel[0]}` },
  { label: "Appointment", icon: Calendar, href: "/appointments" },
  { label: "Directions", icon: MapPin, href: "/directions" },
];

export function MobileActionBar() {
  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border-default bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {actions.map(({ label, icon: Icon, href }) => (
        <Link
          key={label}
          href={href}
          className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-text-dark active:bg-neutral-light"
        >
          <span
            className={
              label === "Appointment"
                ? "flex h-9 w-9 items-center justify-center rounded-full bg-pink-accent text-white"
                : "flex h-9 w-9 items-center justify-center rounded-full text-purple-deep"
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
