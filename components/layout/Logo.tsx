import Image from "next/image";
import Link from "next/link";
import { HOSPITAL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ variant = "dark", className }: { variant?: "dark" | "light"; className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "relative block h-11 w-[160px] shrink-0 overflow-hidden rounded-lg sm:h-12 sm:w-[196px]",
        variant === "light" && "bg-white px-2",
        className
      )}
      aria-label={`${HOSPITAL.name} home`}
    >
      <Image
        src="/images/logos/satellite-general-hospital-logo.png"
        alt="Satellite General Hospital"
        fill
        sizes="196px"
        className="object-contain"
        priority
      />
    </Link>
  );
}
