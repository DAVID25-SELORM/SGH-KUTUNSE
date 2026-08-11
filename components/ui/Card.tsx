import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-3xl border border-border-default bg-white p-6", className)}>
      {children}
    </div>
  );
}

export function ElevatedCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border-default bg-white p-6 shadow-[0_8px_30px_-12px_rgba(32,33,42,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-16px_rgba(134,40,138,0.25)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SoftCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-3xl bg-bg-soft p-6", className)}>
      {children}
    </div>
  );
}
