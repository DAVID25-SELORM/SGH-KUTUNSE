import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "success" | "warning" | "info";

const styles: Record<AlertVariant, { wrap: string; icon: React.ElementType }> = {
  success: { wrap: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  warning: { wrap: "bg-amber-50 text-amber-800 border-amber-200", icon: AlertTriangle },
  info: { wrap: "bg-bg-soft text-purple-dark border-border-default", icon: Info },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { wrap, icon: Icon } = styles[variant];
  return (
    <div role="status" className={cn("flex items-start gap-3 rounded-2xl border p-4", wrap, className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="mt-1 text-sm leading-relaxed">{children}</div> : null}
      </div>
    </div>
  );
}
