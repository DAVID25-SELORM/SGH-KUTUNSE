"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ChevronDown } from "lucide-react";
import { mainNav } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { MobileNav } from "@/components/layout/MobileNav";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-border-default bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 md:px-8 lg:px-10">
        <Logo />

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Main navigation">
          {mainNav.map((item) =>
            item.children ? (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-text-dark hover:text-purple-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep"
                  aria-expanded={openDropdown === item.label}
                  onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                >
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <div
                  className={cn(
                    "absolute left-1/2 top-full w-[560px] -translate-x-1/2 pt-3 transition-all duration-200",
                    openDropdown === item.label
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0"
                  )}
                >
                  <div className="grid grid-cols-2 gap-1 rounded-3xl border border-border-default bg-white p-4 shadow-[0_20px_50px_-20px_rgba(32,33,42,0.25)]">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpenDropdown(null)}
                        className="rounded-xl px-3.5 py-2.5 text-sm font-medium text-text-body hover:bg-bg-soft hover:text-purple-deep"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-text-dark hover:text-purple-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Button href="/patient-portal" variant="ghost" size="sm" className="hidden 2xl:inline-flex">
            Patient Portal
          </Button>
          <Button href="/appointments" size="sm" className="hidden sm:inline-flex">
            Book Appointment
          </Button>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-text-dark hover:bg-neutral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep xl:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
