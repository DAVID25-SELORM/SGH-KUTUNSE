import { HOSPITAL, SOCIAL_LINKS } from "@/lib/constants";

export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Hospital",
    name: HOSPITAL.name,
    description: HOSPITAL.tagline,
    url: HOSPITAL.siteUrl,
    ...(HOSPITAL.email ? { email: HOSPITAL.email } : {}),
    ...(SOCIAL_LINKS.length ? { sameAs: SOCIAL_LINKS.map((link) => link.href) } : {}),
    telephone: [...HOSPITAL.phonesTel],
    address: {
      "@type": "PostalAddress",
      streetAddress: HOSPITAL.address,
      addressLocality: "Accra",
      addressCountry: "GH",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "00:00",
      closes: "23:59",
    },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
