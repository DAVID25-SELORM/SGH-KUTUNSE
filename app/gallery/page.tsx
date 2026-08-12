import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/shared/PageHero";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Programs Gallery",
  description: `Photos from community and hospital programs organised by ${HOSPITAL.name}.`,
  path: "/gallery",
});

const photos = Array.from({ length: 8 }, (_, index) => ({
  src: `/images/gallery/program-${String(index + 1).padStart(2, "0")}.jpg`,
  alt: `${HOSPITAL.name} program activity ${index + 1}`,
}));

export default function GalleryPage() {
  return (
    <>
      <PageHero eyebrow="Our Programs" title="Programs Gallery" description="Moments from hospital programs, community engagement, and health activities." crumbs={[{ label: "Gallery" }]} />
      <section className="py-16 sm:py-24">
        <Container>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, index) => (
              <figure key={photo.src} className={`relative overflow-hidden rounded-3xl bg-bg-soft ${index === 0 || index === 5 ? "sm:col-span-2 aspect-[16/9]" : "aspect-[4/3]"}`}>
                <Image src={photo.src} alt={photo.alt} fill sizes={index === 0 || index === 5 ? "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"} className="object-cover transition-transform duration-500 hover:scale-[1.02]" unoptimized preload={index === 0} />
              </figure>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
