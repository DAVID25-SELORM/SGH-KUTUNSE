import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/types";
import { ElevatedCard } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/Icon";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <ElevatedCard className="group flex h-full min-h-64 flex-col overflow-hidden border-transparent p-0 shadow-[0_12px_40px_-24px_rgba(32,33,42,0.3)] sm:min-h-72">
      {service.image ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-bg-soft">
          <Image
            src={service.image}
            alt={service.imageAlt ?? ""}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${service.imagePosition ?? "object-center"}`}
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        {!service.image ? <IconCircle name={service.icon} /> : null}
        <h3 className={service.image ? "text-xl font-semibold tracking-tight text-text-dark" : "mt-8 text-xl font-semibold tracking-tight text-text-dark"}>{service.name}</h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-text-body">{service.shortDescription}</p>
        <Link
          href={`/services/${service.slug}`}
          className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-deep hover:text-purple-dark"
        >
          Learn More
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </ElevatedCard>
  );
}
