"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown, Phone, X } from "lucide-react";
import { mainNav } from "@/data/navigation";
import { HOSPITAL } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

export function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 z-[60] overflow-hidden xl:hidden", isOpen ? "visible" : "invisible")}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation"
        tabIndex={isOpen ? 0 : -1}
        className={cn(
          "absolute inset-0 h-full w-full bg-text-dark/45 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />

      <div
        className={cn(
          "absolute right-0 top-0 isolate flex h-[100dvh] w-full max-w-[390px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out min-[390px]:w-[88%]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex min-h-18 items-center justify-between gap-3 border-b border-border-default px-4 py-3 sm:px-5">
          <Logo className="w-[158px] sm:w-[180px]" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-dark hover:bg-neutral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-4 py-4" aria-label="Mobile navigation links">
          <ul className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                {item.children ? (
                  <details className="group">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-text-dark hover:bg-neutral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep [&::-webkit-details-marker]:hidden">
                      {item.label}
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <ul className="mb-2 mt-1 flex flex-col gap-0.5 border-l-2 border-bg-soft pl-3">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onClose}
                            className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm text-text-body hover:bg-neutral-light hover:text-purple-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex min-h-12 items-center rounded-xl px-3 py-3 text-base font-medium text-text-dark hover:bg-neutral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <Link href="/patient-portal" onClick={onClose} className="mt-2 flex min-h-12 items-center rounded-xl bg-bg-soft px-3 py-3 text-base font-semibold text-purple-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep">Patient Portal</Link>
        </nav>

        <div className="grid shrink-0 gap-3 border-t border-border-default bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:grid-cols-2">
          <Button href="/appointments" onClick={onClose} className="w-full">
            Book Appointment
          </Button>
          <Button href={`tel:${HOSPITAL.phonesTel[0]}`} variant="outline" className="w-full">
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call Hospital
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
