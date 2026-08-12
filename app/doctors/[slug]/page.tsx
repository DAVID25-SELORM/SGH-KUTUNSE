import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Phone, Clock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { PageHero } from "@/components/shared/PageHero";
import { getPublishedDoctor } from "@/lib/server/public-content";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const doctor = await getPublishedDoctor((await params).slug);
  if (!doctor) return {};
  return buildMetadata({ title: doctor.fullName, description: `${doctor.specialty} at ${HOSPITAL.name}.`, path: `/doctors/${doctor.slug}` });
}

export default async function DoctorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const doctor = await getPublishedDoctor((await params).slug);
  if (!doctor) notFound();
  return <><PageHero eyebrow={doctor.specialty} title={doctor.fullName} description={doctor.role || doctor.specialty} crumbs={[{ label: "Doctors", href: "/doctors" }, { label: doctor.fullName }]} /><section className="py-20 sm:py-24"><Container className="grid grid-cols-1 gap-10 lg:grid-cols-3">{doctor.photo ? <div className="relative aspect-square overflow-hidden rounded-3xl bg-bg-soft"><Image src={doctor.photo} alt={doctor.fullName} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" priority /></div> : <ImagePlaceholder label={doctor.specialty} icon="Users" className="aspect-square w-full" />}<div className="lg:col-span-2"><h2 className="text-xl font-semibold text-text-dark">Biography</h2>{doctor.bio ? <p className="mt-3 text-sm leading-relaxed text-text-body">{doctor.bio}</p> : <p className="mt-3 text-sm text-text-muted">Contact the hospital for more information about this clinician.</p>}{doctor.availability ? <div className="mt-8 flex items-center gap-2 text-sm text-text-body"><Clock className="h-4 w-4 text-purple-deep" aria-hidden="true" />{doctor.availability}</div> : null}<div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button href="/appointments">Book Appointment</Button><Button href={`tel:${HOSPITAL.phonesTel[0]}`} variant="outline"><Phone className="h-4 w-4" aria-hidden="true" />Call Hospital</Button></div></div></Container></section></>;
}
