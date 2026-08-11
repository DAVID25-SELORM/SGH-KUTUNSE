import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

/**
 * Decorative stand-in for real hospital photography, used until actual
 * Satellite General Hospital images are supplied (see /public/images/README.md).
 */
export function ImagePlaceholder({
  label,
  icon = "Stethoscope",
  className,
  variant = "soft",
}: {
  label: string;
  icon?: string;
  className?: string;
  variant?: "soft" | "brand";
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-3xl",
        variant === "brand" ? "bg-gradient-brand" : "bg-bg-soft",
        className
      )}
    >
      <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1.5px,transparent_1.5px)] [background-size:18px_18px] text-white" />
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <span
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl",
            variant === "brand" ? "bg-white/15 text-white" : "bg-white text-purple-deep"
          )}
        >
          <Icon name={icon} className="h-7 w-7" />
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            variant === "brand" ? "text-white/80" : "text-text-muted"
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
