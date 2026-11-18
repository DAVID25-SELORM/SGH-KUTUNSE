import { Phone, Calendar, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import { HOSPITAL } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";

const actions = [
  { label: "Call", icon: Phone, href: `tel:${HOSPITAL.phonesTel[0]}`, kind: "plain" },
  { label: "WhatsApp", icon: MessageCircle, href: whatsappLink(), kind: "whatsapp" },
  { label: "Book", icon: Calendar, href: "/appointments", kind: "book" },
  { label: "Directions", icon: MapPin, href: "/directions", kind: "plain" },
] as const;

const circle = {
  plain: "flex h-9 w-9 items-center justify-center rounded-full text-purple-deep",
  book: "flex h-9 w-9 items-center justify-center rounded-full bg-pink-accent text-white",
  whatsapp: "flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white",
};

export function MobileActionBar() {
  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border-default bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {actions.map(({ label, icon: Icon, href, kind }) => {
        const content = (
          <>
            <span className={circle[kind]}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            {label}
          </>
        );
        const className = "flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-text-dark active:bg-neutral-light";
        return kind === "whatsapp" ? (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={className}>
            {content}
          </a>
        ) : (
          <Link key={label} href={href} className={className}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
