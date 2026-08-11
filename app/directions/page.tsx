import type { Metadata } from "next";
import Image from "next/image";
import { MapPin, Signpost } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { MapSection } from "@/components/shared/MapSection";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Directions",
  description: `Landmark-based directions to ${HOSPITAL.name} at Kuntunse Satellite, Near Damax 2.`,
  path: "/directions",
});

const landmarks = [
  "Accra–Nsawam Highway",
  "Pedestrian Footbridge",
  "Satellite Junction",
  "GHS Housing",
  "Koans International School",
  "PK Oil",
  "Mum's Touch",
  "Gatsikope Park",
  "DVLA",
  "Asamoah Gyan Junction",
  "Amelia Junction",
  "Damax 2 Estate",
];

export default function DirectionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Find Us"
        title="Directions to Satellite General Hospital"
        description={`The hospital is located at ${HOSPITAL.address}, along the Accra–Nsawam Highway corridor.`}
        crumbs={[{ label: "Directions" }]}
      />

      <section className="py-16 sm:py-20">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MapSection />
            <div className="mt-8">
              <SectionHeading eyebrow="Landmark Directions" title="Nearby Landmarks" />
              <p className="mt-4 text-sm leading-relaxed text-text-body">
                Satellite General Hospital sits near Damax 2 Estate, off the Accra–Nsawam Highway. If you&apos;re
                travelling by road, use the following landmarks to guide your route:
              </p>
              <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3">
                {landmarks.map((landmark) => (
                  <div
                    key={landmark}
                    className="flex items-center gap-2.5 rounded-2xl border border-border-default bg-white px-4 py-3 text-sm text-text-body"
                  >
                    <Signpost className="h-4 w-4 shrink-0 text-pink-accent" aria-hidden="true" />
                    {landmark}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <Card>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-soft text-purple-deep">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-text-dark">Address</h3>
              <p className="mt-1 text-sm text-text-body">{HOSPITAL.address}</p>
            </Card>
            <figure className="overflow-hidden rounded-3xl border border-border-default bg-white shadow-sm">
              <Image
                src="/images/directions/satellite-general-hospital-directions.png"
                alt="Landmark map showing the route from the Accra–Nsawam Highway and Satellite Junction to Satellite General Hospital near Damax 2 Estate"
                width={1048}
                height={1488}
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="h-auto w-full"
              />
              <figcaption className="border-t border-border-default px-4 py-3 text-xs leading-relaxed text-text-muted">
                Official landmark directions supplied by Satellite General Hospital.
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>
    </>
  );
}
