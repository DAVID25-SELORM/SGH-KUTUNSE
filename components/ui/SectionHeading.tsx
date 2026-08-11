import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <span className="inline-flex items-center rounded-full bg-bg-soft px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-purple-deep">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-text-dark sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-text-body">{description}</p> : null}
    </div>
  );
}
