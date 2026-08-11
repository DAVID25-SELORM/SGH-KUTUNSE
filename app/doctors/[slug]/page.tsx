import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, Clock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { PageHero } from "@/components/shared/PageHero";
import { getDoctorBySlug, doctors } from "@/data/doctors";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export function generateStaticParams() {
  return doctors.map((doctor) => ({ slug: doctor.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doctor = getDoctorBySlug(slug);
  if (!doctor) return {};
  return buildMetadata({
    title: doctor.fullName,
    description: `${doctor.role} at ${HOSPITAL.name}. Demo profile pending verified staff information.`,
    path: `/doctors/${doctor.slug}`,
  });
}

export default async function DoctorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doctor = getDoctorBySlug(slug);
  if (!doctor) notFound();

  return (
    <>
      <PageHero
        eyebrow={doctor.specialty}
        title={doctor.fullName}
        description={doctor.role}
        crumbs={[{ label: "Doctors", href: "/doctors" }, { label: doctor.fullName }]}
      />

      <section className="py-20 sm:py-24">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <ImagePlaceholder label={`${doctor.fullName} — demo photo placeholder`} icon="Users" className="aspect-square w-full" />

          <div className="lg:col-span-2">
            <Badge variant="neutral">Demo profile — to be replaced with verified staff data</Badge>
            <h2 className="mt-4 text-xl font-semibold text-text-dark">Biography</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-body">{doctor.bio}</p>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-text-body">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-deep" aria-hidden="true" />
                {doctor.availability}
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/appointments">Book Appointment</Button>
              <Button href={`tel:${HOSPITAL.phonesTel[0]}`} variant="outline">
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call Hospital
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
