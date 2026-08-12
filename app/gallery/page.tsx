import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { GalleryExplorer } from "@/components/gallery/GalleryExplorer";
import { getPublishedGalleryAlbums } from "@/lib/server/gallery";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({ title: "Programs & Community Gallery", description: `Community outreach, health programs, staff activities and moments from ${HOSPITAL.name}.`, path: "/gallery" });
export default async function GalleryPage() { const albums = await getPublishedGalleryAlbums(); return <><section className="border-b border-border-default bg-gradient-to-br from-white to-bg-soft py-10 sm:py-14"><Container><nav aria-label="Breadcrumb" className="text-sm text-text-muted"><Link href="/" className="hover:text-purple-deep">Home</Link><span aria-hidden="true"> / </span><span>Gallery</span></nav><p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-pink-accent">Programs & Community</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-purple-deep sm:text-6xl">Moments That Matter</h1><p className="mt-4 max-w-2xl text-base leading-7 text-text-body">A look at our community outreach, health programs, staff activities and moments from Satellite General Hospital.</p></Container></section><section className="py-10 sm:py-14"><Container><GalleryExplorer albums={albums} /></Container></section></>; }
