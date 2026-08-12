import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Alert";
import { PageHero } from "@/components/shared/PageHero";
import { ArticleCard } from "@/components/shared/ArticleCard";
import { getPublishedArticle, getPublishedArticles } from "@/lib/server/public-content";
import { buildMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const article = await getPublishedArticle((await params).slug); return article ? buildMetadata({ title: article.title, description: article.excerpt, path: `/health/${article.slug}` }) : {}; }

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getPublishedArticle((await params).slug);
  if (!article) notFound();
  const related = (await getPublishedArticles()).filter(item => item.slug !== article.slug).slice(0, 3);
  return <><PageHero eyebrow={article.category} title={article.title} description={`By ${article.author} · ${new Date(article.date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`} crumbs={[{ label: "Health Articles", href: "/health" }, { label: article.title }]} /><section className="py-16 sm:py-20"><Container className="mx-auto max-w-3xl">{article.heroImage ? <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-bg-soft"><Image src={article.heroImage} alt="" fill sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" priority /></div> : null}<div className="prose-content mt-8 flex flex-col gap-4">{article.content.map((paragraph, index) => <p key={index} className="text-base leading-relaxed text-text-body">{paragraph}</p>)}</div><Alert variant="info" title="Medical Disclaimer" className="mt-10">This article is for general information only and does not replace professional medical advice. Please consult a doctor at Satellite General Hospital for guidance specific to your health.</Alert></Container></section>{related.length > 0 ? <section className="bg-neutral-light py-16 sm:py-20"><Container><h2 className="text-xl font-semibold tracking-tight text-text-dark">Related Articles</h2><div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{related.map(item => <ArticleCard key={item.slug} article={item} />)}</div></Container></section> : null}</>;
}
