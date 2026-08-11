import type { Metadata } from "next";
import { HOSPITAL } from "@/lib/constants";

export function buildMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${HOSPITAL.siteUrl}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${HOSPITAL.name}`,
      description,
      url,
      siteName: HOSPITAL.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${HOSPITAL.name}`,
      description,
    },
  };
}
