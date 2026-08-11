"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FAQItem } from "@/types";
import { cn } from "@/lib/utils";

export function FAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col divide-y divide-border-default rounded-3xl border border-border-default bg-white">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.question}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-6 sm:py-5"
            >
              <span className="text-sm font-semibold text-text-dark sm:text-base">{item.question}</span>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 text-purple-deep transition-transform", isOpen && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            {isOpen ? (
              <div className="px-4 pb-5 text-sm leading-relaxed text-text-body sm:px-6">{item.answer}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
