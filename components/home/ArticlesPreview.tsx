import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { getPublishedArticles } from "@/lib/server/public-content";

export async function ArticlesPreview() {
  const articles = (await getPublishedArticles()).slice(0, 3);
  if (!articles.length) return null;
  return <section className="py-20 sm:py-24"><Container><div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"><SectionHeading eyebrow="Health Articles" title="Health Tips & Hospital News" description="Hospital-approved health information and news from our team." /><Button href="/health" variant="outline" className="shrink-0">View All Articles</Button></div><div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{articles.map(article => <ArticleCard key={article.slug} article={article} />)}</div></Container></section>;
}
