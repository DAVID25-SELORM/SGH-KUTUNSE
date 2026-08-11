import { Container } from "@/components/ui/Container";
import { Breadcrumbs, type Crumb } from "@/components/shared/Breadcrumbs";

export function PageHero({
  eyebrow,
  title,
  description,
  crumbs,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  crumbs?: Crumb[];
}) {
  return (
    <section className="border-b border-border-default bg-bg-soft py-14 sm:py-16">
      <Container>
        {crumbs ? <Breadcrumbs items={crumbs} className="mb-6" /> : null}
        {eyebrow ? (
          <span className="inline-flex items-center rounded-full bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-purple-deep">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-text-dark sm:text-5xl">{title}</h1>
        {description ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-body">{description}</p> : null}
      </Container>
    </section>
  );
}
