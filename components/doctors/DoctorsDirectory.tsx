"use client";

import { useState } from "react";
import type { Doctor, DoctorSpecialty } from "@/types";
import { doctorSpecialtyFilters } from "@/data/doctors";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

export function DoctorsDirectory({ doctors }: { doctors: Doctor[] }) {
  const [filter, setFilter] = useState<(typeof doctorSpecialtyFilters)[number]>("All");

  const filtered = filter === "All" ? doctors : doctors.filter((d) => d.specialty === (filter as DoctorSpecialty));

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter doctors by specialty">
          {doctorSpecialtyFilters.map((specialty) => (
            <button
              key={specialty}
              onClick={() => setFilter(specialty)}
              aria-pressed={filter === specialty}
              className={cn(
                "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep",
                filter === specialty
                  ? "border-purple-deep bg-purple-deep text-white"
                  : "border-border-default bg-white text-text-body hover:border-purple-deep hover:text-purple-deep"
              )}
            >
              {specialty}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doctor) => (
              <DoctorCard key={doctor.slug} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-border-default bg-bg-soft p-12 text-center">
            <p className="text-sm font-medium text-text-body">No doctors found for this specialty yet.</p>
          </div>
        )}
      </Container>
    </section>
  );
}
