import {
  Stethoscope,
  BedDouble,
  Pill,
  Home,
  Apple,
  HeartPulse,
  Baby,
  Ear,
  Smile,
  Eye,
  FlaskConical,
  Activity,
  Waves,
  ClipboardCheck,
  Dumbbell,
  Scissors,
  Video,
  Building2,
  Phone,
  MapPin,
  Clock,
  Shield,
  Users,
  CheckCircle2,
  ArrowRight,
  Calendar,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const iconMap: Record<string, LucideIcon> = {
  Stethoscope,
  BedDouble,
  Pill,
  Home,
  Apple,
  HeartPulse,
  Baby,
  Ear,
  Smile,
  Eye,
  FlaskConical,
  Activity,
  Waves,
  ClipboardCheck,
  Dumbbell,
  Scissors,
  Video,
  Building2,
  Phone,
  MapPin,
  Clock,
  Shield,
  Users,
  CheckCircle2,
  ArrowRight,
  Calendar,
  MessageCircle,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = iconMap[name] ?? Stethoscope;
  return <Cmp className={cn("h-5 w-5", className)} aria-hidden="true" />;
}

export function IconCircle({
  name,
  className,
  variant = "purple",
}: {
  name: string;
  className?: string;
  variant?: "purple" | "pink";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
        variant === "purple" ? "bg-bg-soft text-purple-deep" : "bg-pink-accent/10 text-pink-dark",
        className
      )}
    >
      <Icon name={name} className="h-6 w-6" />
    </span>
  );
}
