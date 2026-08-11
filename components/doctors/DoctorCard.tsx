import type { Doctor } from "@/types";
import { ElevatedCard } from "@/components/ui/Card";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <ElevatedCard className="flex flex-col">
      <ImagePlaceholder label={`${doctor.fullName} — demo photo placeholder`} icon="Users" className="aspect-square w-full" />
      <div className="mt-5 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-text-dark">{doctor.fullName}</h3>
            <p className="text-sm text-purple-deep">{doctor.role}</p>
          </div>
          <Badge variant="neutral">Demo</Badge>
        </div>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-text-body">{doctor.bio}</p>
        <p className="mt-3 text-xs font-medium text-text-muted">Availability: {doctor.availability}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button href={`/doctors/${doctor.slug}`} variant="outline" size="sm" className="flex-1">
            View Profile
          </Button>
          <Button href="/appointments" size="sm" className="flex-1">
            Book Appointment
          </Button>
        </div>
      </div>
    </ElevatedCard>
  );
}
