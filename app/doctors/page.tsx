import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { CTASection } from "@/components/shared/CTASection";
import { DoctorsDirectory } from "@/components/doctors/DoctorsDirectory";
import { doctors } from "@/data/doctors";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Doctors & Specialists",
  description: `Meet the care team at ${HOSPITAL.name}. Profiles shown are demo/placeholder data pending verified staff information.`,
  path: "/doctors",
});

export default function DoctorsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Team"
        title="Doctors & Specialists"
        description="Profiles shown below are placeholder/demo data structured for easy replacement with verified hospital staff information."
        crumbs={[{ label: "Doctors" }]}
      />
      <DoctorsDirectory doctors={doctors} />
      <CTASection />
    </>
  );
}
