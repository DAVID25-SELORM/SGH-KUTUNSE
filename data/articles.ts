import type { Article } from "@/types";

// DEMO CONTENT: Placeholder articles for layout/design purposes only.
// Replace with real hospital-authored content before launch.
export const articles: Article[] = [
  {
    slug: "why-regular-health-screening-matters",
    title: "Why Regular Health Screening Matters",
    category: "Preventive Care",
    date: "2026-06-02",
    heroImage: "/images/articles/health-screening.webp",
    authorPlaceholder: "Hospital Editorial Team (Demo)",
    excerpt:
      "Placeholder article introducing the value of routine health screening as part of preventive care.",
    content: [
      "This is placeholder demo content for the Satellite General Hospital health articles section.",
      "Replace this text with real, medically reviewed content before publishing.",
    ],
    isDemoContent: true,
  },
  {
    slug: "caring-for-your-child-health-basics",
    title: "Caring for Your Child: Health Basics for Parents",
    category: "Child Health",
    date: "2026-05-18",
    heroImage: "/images/articles/child-health.webp",
    authorPlaceholder: "Hospital Editorial Team (Demo)",
    excerpt: "Placeholder article covering general child health guidance for parents.",
    content: [
      "This is placeholder demo content for the Satellite General Hospital health articles section.",
      "Replace this text with real, medically reviewed content before publishing.",
    ],
    isDemoContent: true,
  },
  {
    slug: "understanding-antenatal-care",
    title: "Understanding Antenatal Care",
    category: "Women's Health",
    date: "2026-04-27",
    heroImage: "/images/articles/antenatal-care.webp",
    authorPlaceholder: "Hospital Editorial Team (Demo)",
    excerpt: "Placeholder article on the importance of antenatal visits during pregnancy.",
    content: [
      "This is placeholder demo content for the Satellite General Hospital health articles section.",
      "Replace this text with real, medically reviewed content before publishing.",
    ],
    isDemoContent: true,
  },
];

export const articleCategories = [
  "All",
  "General Health",
  "Women's Health",
  "Child Health",
  "Diabetes",
  "Heart Health",
  "Nutrition",
  "Preventive Care",
  "Hospital News",
] as const;

export function getArticleBySlug(slug: string) {
  return articles.find((a) => a.slug === slug);
}
