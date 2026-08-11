import { MapPin, ExternalLink } from "lucide-react";
import { HOSPITAL } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${HOSPITAL.name}, ${HOSPITAL.address}`
)}`;

export function MapSection({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-3xl border border-border-default", className)}>
      <div className="relative flex aspect-[16/9] w-full items-center justify-center bg-bg-soft sm:aspect-[21/9]">
        <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(currentColor_1.5px,transparent_1.5px)] [background-size:20px_20px] text-purple-deep" />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-purple-deep shadow-sm">
            <MapPin className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-text-dark">{HOSPITAL.name}</p>
            <p className="text-xs text-text-muted">{HOSPITAL.address}</p>
          </div>
          <p className="max-w-xs text-xs text-text-muted">
            Map embed placeholder — an interactive Google Map will be embedded here.
          </p>
        </div>
      </div>
      <div className="flex flex-col items-stretch gap-3 bg-white p-4 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
        <p className="text-sm text-text-body">{HOSPITAL.address}</p>
        <Button href={directionsUrl} target="_blank" rel="noopener noreferrer" variant="outline" size="sm" className="w-full shrink-0 min-[430px]:w-auto">
          Get Directions
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
