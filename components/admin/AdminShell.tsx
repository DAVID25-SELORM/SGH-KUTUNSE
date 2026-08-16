"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  FileText,
  GalleryHorizontal,
  HeartHandshake,
  Home,
  Menu,
  MessageSquare,
  Newspaper,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import {
  hasPermission,
  type AdminRole,
  type Permission,
} from "@/lib/types/admin";
import { LogoutButton } from "./LogoutButton";
import { AdminNotifications } from "./AdminNotifications";
const groups: Array<{
  label: string;
  items: Array<{
    href: string;
    label: string;
    icon: typeof Home;
    permission?: Permission;
  }>;
}> = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: BarChart3 },
      {
        href: "/admin/analytics",
        label: "Website analytics",
        icon: BarChart3,
        permission: "analytics_view",
      },
    ],
  },
  {
    label: "Requests",
    items: [
      {
        href: "/admin/appointments",
        label: "Appointments",
        icon: CalendarDays,
        permission: "appointments",
      },
      {
        href: "/admin/contact",
        label: "Contact",
        icon: MessageSquare,
        permission: "contact",
      },
      {
        href: "/admin/insurance",
        label: "Insurance",
        icon: ShieldCheck,
        permission: "insurance",
      },
      {
        href: "/admin/corporate",
        label: "Corporate",
        icon: HeartHandshake,
        permission: "corporate",
      },
      {
        href: "/admin/telemedicine",
        label: "Telemedicine",
        icon: Stethoscope,
        permission: "telemedicine",
      },
      {
        href: "/admin/feedback",
        label: "Patient feedback",
        icon: MessageSquare,
        permission: "feedback",
      },
      {
        href: "/admin/contacts",
        label: "Contacts",
        icon: Users,
        permission: "contacts",
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        href: "/admin/content/doctors",
        label: "Doctors",
        icon: Users,
        permission: "content",
      },
      {
        href: "/admin/content/services",
        label: "Services",
        icon: Stethoscope,
        permission: "content",
      },
      {
        href: "/admin/content/articles",
        label: "Health articles",
        icon: Newspaper,
        permission: "content",
      },
      {
        href: "/admin/content/gallery",
        label: "Gallery",
        icon: GalleryHorizontal,
        permission: "content",
      },
      {
        href: "/admin/content/insurance-partners",
        label: "Insurance partners",
        icon: ShieldCheck,
        permission: "content",
      },
      {
        href: "/admin/content/site-settings",
        label: "Site settings",
        icon: Settings,
        permission: "content",
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        href: "/admin/notifications",
        label: "Notifications",
        icon: MessageSquare,
      },
      {
        href: "/admin/settings/sms",
        label: "SMS settings",
        icon: Settings,
        permission: "sms_settings_view",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        href: "/admin/users",
        label: "Administrators",
        icon: Users,
        permission: "users",
      },
      {
        href: "/admin/audit",
        label: "Audit logs",
        icon: FileText,
        permission: "audit",
      },
    ],
  },
];
const roleName = (role: AdminRole) =>
  role
    .split("_")
    .map((x) => x[0].toUpperCase() + x.slice(1))
    .join(" ");
export function AdminShell({
  children,
  email,
  roles,
}: {
  children: React.ReactNode;
  email: string;
  roles: AdminRole[];
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", key);
    };
  }, [open]);
  const nav = (
    <nav
      aria-label="Admin navigation"
      className="flex-1 overflow-y-auto px-3 py-5"
    >
      {groups.map((group) => {
        const items = group.items.filter(
          (item) => !item.permission || hasPermission(roles, item.permission),
        );
        if (!items.length) return null;
        return (
          <div key={group.label} className="mb-6">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.14em] text-text-muted">
              {group.label}
            </p>
            <div className="space-y-1">
              {items.map((item) => {
                const active =
                  item.href === "/admin"
                    ? path === item.href
                    : path.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${active ? "bg-purple-deep text-white" : "text-text-body hover:bg-bg-soft hover:text-purple-deep"}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="border-t border-border-default pt-4">
        <Link
          href="/"
          prefetch={false}
          onClick={() => setOpen(false)}
          className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-text-body hover:bg-bg-soft"
        >
          <Home className="h-4 w-4" />
          View website
        </Link>
      </div>
    </nav>
  );
  return (
    <div className="min-h-screen overflow-x-hidden bg-neutral-light">
      <header className="sticky top-0 z-40 flex h-16 min-w-0 items-center border-b border-border-default bg-white px-2 sm:px-4 min-[900px]:pl-[276px]">
        <button
          onClick={() => setOpen(true)}
          className="mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl hover:bg-bg-soft sm:mr-3 min-[900px]:hidden"
          aria-label="Open admin navigation"
          aria-expanded={open}
          aria-controls="admin-mobile-navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden min-w-0 min-[390px]:block">
          <p className="font-bold text-purple-deep">SGH Administration</p>
          <p className="text-xs text-text-muted">Secure hospital operations</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
          <AdminNotifications />
          <Link
            href="/"
            prefetch={false}
            className="hidden rounded-xl border border-border-default px-3 py-2 text-sm font-semibold sm:block"
          >
            View website
          </Link>
          <div className="hidden max-w-56 text-right md:block">
            <p className="truncate text-sm font-semibold">{email}</p>
            <p className="text-xs text-text-muted">
              {roles.map(roleName).join(", ")}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-border-default bg-white min-[900px]:flex">
        <div className="flex h-16 items-center border-b border-border-default px-6">
          <strong className="text-lg text-purple-deep">SGH Admin</strong>
        </div>
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 min-[900px]:hidden">
          <button
            className="absolute inset-0 bg-text-dark/50"
            aria-label="Close admin navigation"
            onClick={() => setOpen(false)}
          />
          <aside
            ref={drawerRef}
            id="admin-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="fixed inset-y-0 left-0 flex w-[88vw] max-w-80 flex-col overflow-hidden border-r border-border-default bg-white shadow-2xl"
          >
            <div className="flex h-16 items-center justify-between border-b px-5">
              <strong className="text-purple-deep">SGH Admin</strong>
              <button
                ref={closeRef}
                onClick={() => setOpen(false)}
                aria-label="Close admin navigation"
                className="grid h-11 w-11 place-items-center rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
      <main
        id="main-content"
        className="min-w-0 overflow-x-hidden p-3 sm:p-6 min-[900px]:ml-64 min-[900px]:p-8"
      >
        {children}
      </main>
    </div>
  );
}
