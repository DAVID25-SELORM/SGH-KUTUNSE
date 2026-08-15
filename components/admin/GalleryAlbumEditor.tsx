"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GalleryAlbumInput } from "@/lib/gallery";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

const blank: GalleryAlbumInput = {
  title: "",
  slug: "",
  category: "",
  shortDescription: "",
  fullDescription: "",
  eventDate: "",
  location: "",
  coverImageId: "",
  images: [],
  displayOrder: 0,
  featured: false,
  status: "draft",
};
export function GalleryAlbumEditor({
  id,
  initial = blank,
}: {
  id?: string;
  initial?: GalleryAlbumInput;
}) {
  const [data, setData] = useState(initial);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const router = useRouter();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(`/api/admin/gallery${id ? `/${id}` : ""}`, {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "Album could not be saved.");
      return;
    }
    router.push("/admin/content/gallery");
    router.refresh();
  }
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!id || !event.target.files?.length) return;
    setUploading(true);
    setMessage("");
    for (const file of Array.from(event.target.files)) {
      const form = new FormData();
      form.set("image", file);
      const response = await fetch(`/api/admin/gallery/${id}/images`, {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.message ?? "Upload failed.");
        break;
      }
      setData((current) => ({
        ...current,
        images: [
          ...current.images,
          { ...result.image, order: current.images.length },
        ],
      }));
    }
    setUploading(false);
    event.target.value = "";
  }
  function updateImage(index: number, changes: Record<string, unknown>) {
    setData((current) => ({
      ...current,
      images: current.images.map((image, i) =>
        i === index ? { ...image, ...changes } : image,
      ),
    }));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= data.images.length) return;
    const images = [...data.images];
    [images[index], images[target]] = [images[target], images[index]];
    setData({
      ...data,
      images: images.map((image, order) => ({ ...image, order })),
    });
  }
  async function remove(index: number) {
    const image = data.images[index];
    if (id && image.storagePath) {
      const response = await fetch(`/api/admin/gallery/${id}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: image.id,
          storagePath: image.storagePath,
        }),
      });
      if (!response.ok) {
        setMessage("Image could not be removed.");
        return;
      }
    }
    setData({
      ...data,
      images: data.images
        .filter((_, i) => i !== index)
        .map((item, order) => ({ ...item, order })),
      coverImageId: data.coverImageId === image.id ? "" : data.coverImageId,
    });
  }
  function field(
    name: keyof GalleryAlbumInput,
    label: string,
    required = false,
    type = "text",
  ) {
    return (
      <label className="text-sm font-semibold">
        {label}
        <input
          type={type}
          required={required}
          value={String(data[name] ?? "")}
          onChange={(event) =>
            setData({
              ...data,
              [name]:
                type === "number"
                  ? Number(event.target.value)
                  : event.target.value,
            })
          }
          className="mt-1 w-full rounded-xl border border-border-default p-3"
        />
      </label>
    );
  }
  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm"
    >
      {field("title", "Title", true)}
      {field("slug", "Slug", true)}
      {field("category", "Category", true)}
      <label className="text-sm font-semibold">
        Short description
        <textarea
          value={data.shortDescription}
          onChange={(event) =>
            setData({ ...data, shortDescription: event.target.value })
          }
          className="mt-1 w-full rounded-xl border border-border-default p-3"
        />
      </label>
      <label className="text-sm font-semibold">
        Full description
        <textarea
          value={data.fullDescription}
          onChange={(event) =>
            setData({ ...data, fullDescription: event.target.value })
          }
          className="mt-1 w-full rounded-xl border border-border-default p-3"
        />
      </label>
      {field("eventDate", "Verified event/program date", false, "date")}
      {field("location", "Verified location")}
      {field("displayOrder", "Display order", false, "number")}
      <label className="flex gap-3">
        <input
          type="checkbox"
          checked={data.featured}
          onChange={(event) =>
            setData({ ...data, featured: event.target.checked })
          }
        />
        Featured album
      </label>
      <label className="text-sm font-semibold">
        Status
        <select
          value={data.status}
          onChange={(event) =>
            setData({
              ...data,
              status: event.target.value as GalleryAlbumInput["status"],
            })
          }
          className="mt-1 w-full rounded-xl border border-border-default p-3"
        >
          <option>draft</option>
          <option>published</option>
          <option>archived</option>
        </select>
      </label>
      {id ? (
        <label className="rounded-xl border border-dashed border-border-default p-5 text-sm font-semibold">
          Upload gallery images
          <input
            className="mt-3 block w-full"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={uploading}
            onChange={upload}
          />
          <span className="mt-2 block font-normal text-text-muted">
            JPEG, PNG, WebP or AVIF; maximum 12 MB each.{" "}
            {uploading ? "Uploading…" : ""}
          </span>
        </label>
      ) : (
        <p className="rounded-xl bg-bg-soft p-4 text-sm text-text-muted">
          Create the draft first, then open it to upload images.
        </p>
      )}
      <div className="grid gap-4">
        {data.images.map((image, index) => (
          <article
            key={image.id}
            className="grid gap-4 rounded-2xl border border-border-default p-4 sm:grid-cols-[160px_1fr]"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-bg-soft">
              <Image
                src={image.url}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="grid gap-3">
              <label className="text-sm font-semibold">
                Alt text
                <input
                  required={data.status === "published"}
                  value={image.alt}
                  onChange={(event) =>
                    updateImage(index, { alt: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border p-2"
                />
              </label>
              <label className="text-sm font-semibold">
                Caption
                <input
                  value={image.caption ?? ""}
                  onChange={(event) =>
                    updateImage(index, { caption: event.target.value })
                  }
                  className="mt-1 w-full rounded-xl border p-2"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setData({ ...data, coverImageId: image.id })}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  {data.coverImageId === image.id
                    ? "Cover image"
                    : "Make cover"}
                </button>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                >
                  Move up
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === data.images.length - 1}
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                >
                  Move down
                </button>
                <button
                  type="button"
                  onClick={() => setRemoveIndex(index)}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <button
        disabled={uploading}
        className="rounded-xl bg-purple-deep p-3 font-semibold text-white disabled:opacity-50"
      >
        {id ? "Save album" : "Create draft"}
      </button>
      {message ? <p role="status">{message}</p> : null}
      <ConfirmModal
        open={removeIndex !== null}
        title="Remove Gallery Image"
        description="Remove this image from the album? This cannot be undone after saving."
        confirmLabel="Remove Image"
        dangerous
        disabled={uploading}
        onClose={() => setRemoveIndex(null)}
        onConfirm={async () => {
          if (removeIndex === null) return;
          await remove(removeIndex);
          setRemoveIndex(null);
        }}
      />
    </form>
  );
}
