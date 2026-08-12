import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { CTASection } from "@/components/shared/CTASection";
import { DoctorsDirectory } from "@/components/doctors/DoctorsDirectory";
import { doctors } from "@/data/doctors";
import { approvedSpecialties } from "@/data/doctors";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Doctors & Specialists",
  description: `Explore clinical specialties available at ${HOSPITAL.name}. Verified clinician profiles will be published after hospital approval.`,
  path: "/doctors",
});

export default function DoctorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Team"
        title="Doctors & Specialists"
        description="Explore our clinical specialties. Individual clinician profiles are published only after hospital verification."
        crumbs={[{ label: "Doctors" }]}
      />
      {doctors.length ? <DoctorsDirectory doctors={doctors} /> : <section className="py-16 sm:py-20"><Container><h2 className="text-2xl font-semibold text-purple-deep">Clinical specialties</h2><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{approvedSpecialties.map(specialty=><div key={specialty} className="rounded-2xl border border-border-default bg-white p-5 font-semibold text-text-dark">{specialty}</div>)}</div><p className="mt-6 text-sm text-text-muted">Contact the hospital to confirm current clinician availability.</p></Container></section>}
      <CTASection />
    </>
  );
}
