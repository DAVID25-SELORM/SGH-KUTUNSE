"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryAlbum } from "@/lib/gallery";

export function AlbumViewer({ album }: { album: GalleryAlbum }) {
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (active === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight")
        setActive((value) =>
          value === null ? null : (value + 1) % album.images.length,
        );
      if (event.key === "ArrowLeft")
        setActive((value) =>
          value === null
            ? null
            : (value - 1 + album.images.length) % album.images.length,
        );
      if (event.key === "Tab") {
        const controls = document.querySelectorAll<HTMLElement>(
          "[data-lightbox-control]",
        );
        if (!controls.length) return;
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", key);
      triggerRef.current?.focus();
    };
  }, [active, album.images.length]);
  const sorted = [...album.images].sort((a, b) => a.order - b.order);
  const image = active === null ? null : sorted[active];
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((photo, index) => (
          <button
            key={photo.id}
            ref={(element) => {
              if (element && active === index) triggerRef.current = element;
            }}
            type="button"
            onClick={(event) => {
              triggerRef.current = event.currentTarget;
              setActive(index);
            }}
            className={`relative overflow-hidden rounded-3xl bg-[#f4eff6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep ${index === 0 ? "aspect-[16/9] sm:col-span-2" : "aspect-[4/3]"}`}
            aria-label={`Open photo ${index + 1} of ${sorted.length}`}
          >
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes={
                index === 0
                  ? "(max-width: 768px) 100vw, 66vw"
                  : "(max-width: 768px) 100vw, 33vw"
              }
              className="object-contain"
              unoptimized={photo.url.startsWith("/")}
            />
          </button>
        ))}
      </div>
      {image ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${album.title} photo viewer`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
        >
          <button
            ref={closeRef}
            data-lightbox-control
            onClick={() => setActive(null)}
            className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-text-dark"
            aria-label="Close gallery"
          >
            <X />
          </button>
          <button
            data-lightbox-control
            onClick={() =>
              setActive((active! - 1 + sorted.length) % sorted.length)
            }
            className="absolute left-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-text-dark"
            aria-label="Previous photo"
          >
            <ChevronLeft />
          </button>
          <figure className="flex max-h-[90vh] max-w-6xl flex-col items-center">
            <div className="relative h-[72vh] w-[80vw]">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="90vw"
                className="object-contain"
                unoptimized={image.url.startsWith("/")}
              />
            </div>
            <figcaption className="mt-3 text-center text-sm text-white">
              <span>
                {active! + 1} / {sorted.length}
              </span>
              {image.caption ? (
                <span className="ml-3">{image.caption}</span>
              ) : null}
            </figcaption>
          </figure>
          <button
            data-lightbox-control
            onClick={() => setActive((active! + 1) % sorted.length)}
            className="absolute right-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-text-dark"
            aria-label="Next photo"
          >
            <ChevronRight />
          </button>
        </div>
      ) : null}
    </>
  );
}
