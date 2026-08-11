import { cn } from "@/lib/utils";

type BadgeVariant = "purple" | "pink" | "neutral" | "outline";

const styles: Record<BadgeVariant, string> = {
  purple: "bg-bg-soft text-purple-deep",
  pink: "bg-pink-accent/10 text-pink-dark",
  neutral: "bg-neutral-light text-text-body",
  outline: "border border-border-default text-text-body",
};

export function Badge({
  variant = "purple",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
