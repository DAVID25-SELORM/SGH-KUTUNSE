import Image from "next/image";
import type { Doctor } from "@/types";
import { ElevatedCard } from "@/components/ui/Card";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { Button } from "@/components/ui/Button";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <ElevatedCard className="flex flex-col">
      {doctor.photo ? <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-bg-soft"><Image src={doctor.photo} alt={doctor.fullName} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></div> : <ImagePlaceholder label={doctor.specialty} icon="Users" className="aspect-square w-full" />}
      <div className="mt-5 flex flex-1 flex-col">
        <h3 className="text-base font-semibold text-text-dark">{doctor.fullName}</h3>
        <p className="text-sm text-purple-deep">{doctor.specialty}</p>
        {doctor.role ? <p className="mt-1 text-xs text-text-muted">{doctor.role}</p> : null}
        {doctor.bio ? <p className="mt-3 flex-1 text-sm leading-relaxed text-text-body">{doctor.bio}</p> : <div className="flex-1" />}
        {doctor.availability ? <p className="mt-3 text-xs font-medium text-text-muted">Availability: {doctor.availability}</p> : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button href={`/doctors/${doctor.slug}`} variant="outline" size="sm" className="flex-1">View Profile</Button><Button href="/appointments" size="sm" className="flex-1">Book Appointment</Button></div>
      </div>
    </ElevatedCard>
  );
}
