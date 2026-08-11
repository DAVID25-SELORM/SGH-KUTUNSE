export const HOSPITAL = {
  name: "Satellite General Hospital",
  shortName: "SGH",
  tagline: "Friendly Healthcare, Premium Experience...",
  address: "Kuntunse Satellite, Near Damax 2",
  city: "Accra, Ghana",
  phones: ["0303984314", "059 257 5075"] as const,
  phonesTel: ["+233303984314", "+233592575075"] as const,
  hours: "Open 24/7",
  email: null as string | null,
  siteUrl: "https://satellitegeneralhospital.com",
} as const;

export const SOCIAL_LINKS: { label: string; href: string }[] = [];
