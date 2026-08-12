import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/shared/PageHero";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { getPublishedArticles } from "@/lib/server/public-content";
import { buildMetadata } from "@/lib/metadata";
import { HOSPITAL } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({ title: "Health Articles", description: `Health tips and hospital news from ${HOSPITAL.name}.`, path: "/health" });

export default async function HealthArticlesPage() {
  const articles = await getPublishedArticles();
  return <><PageHero eyebrow="Health Articles" title="Health Tips & Hospital News" description="Hospital-approved health information and news appear here after clinical and editorial review." crumbs={[{ label: "Health Articles" }]} /><section className="py-20 sm:py-24"><Container>{articles.length > 0 ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{articles.map(article => <ArticleCard key={article.slug} article={article} />)}</div> : <div className="rounded-3xl border border-dashed border-border-default bg-bg-soft p-12 text-center"><p className="text-sm font-medium text-text-body">No articles published yet.</p></div>}</Container></section></>;
}
