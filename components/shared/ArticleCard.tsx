import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/types";
import { ElevatedCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/health/${article.slug}`} className="group block h-full">
      <ElevatedCard className="flex h-full flex-col p-0 overflow-hidden">
        {article.heroImage ? <div className="relative aspect-[16/10] overflow-hidden bg-bg-soft"><Image src={article.heroImage} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></div> : null}
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center gap-2">
            <Badge>{article.category}</Badge>
            <span className="text-xs text-text-muted">
              {new Date(article.date).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-text-dark group-hover:text-purple-deep">{article.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-text-body">{article.excerpt}</p>
        </div>
      </ElevatedCard>
    </Link>
  );
}
