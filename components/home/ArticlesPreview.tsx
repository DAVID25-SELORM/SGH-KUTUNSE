import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { articles } from "@/data/articles";

export function ArticlesPreview() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Health Articles"
            title="Health Tips & Hospital News"
            description="Demo articles shown for layout purposes — replace with real, medically reviewed content."
          />
          <Button href="/health" variant="outline" className="shrink-0">
            View All Articles
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </Container>
    </section>
  );
}
