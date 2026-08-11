import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/shared/PageHero";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { articles } from "@/data/articles";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const metadata: Metadata = buildMetadata({
  title: "Health Articles",
  description: `Health tips and hospital news from ${HOSPITAL.name}.`,
  path: "/health",
});

export default function HealthArticlesPage() {
  return (
    <>
      <PageHero
        eyebrow="Health Articles"
        title="Health Tips & Hospital News"
        description="Demo articles shown for layout purposes — replace with real, medically reviewed content before launch."
        crumbs={[{ label: "Health Articles" }]}
      />

      <section className="py-20 sm:py-24">
        <Container>
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border-default bg-bg-soft p-12 text-center">
              <p className="text-sm font-medium text-text-body">No articles published yet.</p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
