import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { AlbumViewer } from "@/components/gallery/AlbumViewer";
import { getPublishedGalleryAlbum } from "@/lib/server/gallery";
import { buildMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const album=await getPublishedGalleryAlbum((await params).slug);return album?buildMetadata({title:album.title,description:album.shortDescription||"Satellite General Hospital programs gallery.",path:`/gallery/${album.slug}`}):{};}
export default async function AlbumPage({params}:{params:Promise<{slug:string}>}){const album=await getPublishedGalleryAlbum((await params).slug);if(!album)notFound();return <><section className="border-b border-border-default bg-bg-soft py-10 sm:py-14"><Container><nav aria-label="Breadcrumb" className="text-sm text-text-muted"><Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/gallery">Gallery</Link><span aria-hidden="true"> / </span><span>{album.title}</span></nav><p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-pink-accent">{album.category}</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-purple-deep sm:text-6xl">{album.title}</h1>{album.shortDescription?<p className="mt-4 max-w-3xl leading-7 text-text-body">{album.shortDescription}</p>:null}<div className="mt-5 flex flex-wrap gap-5 text-sm text-text-muted">{album.eventDate?<span className="flex items-center gap-2"><CalendarDays className="h-4 w-4"/>{album.eventDate}</span>:null}{album.location?<span className="flex items-center gap-2"><MapPin className="h-4 w-4"/>{album.location}</span>:null}</div></Container></section><section className="py-10 sm:py-14"><Container>{album.fullDescription?<p className="mb-8 max-w-3xl leading-7 text-text-body">{album.fullDescription}</p>:null}<AlbumViewer album={album}/></Container></section></>}
