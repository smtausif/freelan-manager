"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/projects", label: "Projects" },
  { href: "/time", label: "Time" },
  { href: "/invoices", label: "Invoices" },
  { href: "/settings", label: "Settings" },
] as const;

export default function NavTabs() {
  const pathname = usePathname();
  const current = pathname === "/" ? "/dashboard" : pathname;

  return (
    <nav className="w-full min-w-0">
      <div
        className="
          flex items-center gap-1
          overflow-x-auto
          rounded-full border border-slate-200 bg-slate-100
          px-2 py-1 text-sm font-medium
          scroll-smooth
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          w-full
          md:mx-auto md:max-w-xl
          text-slate-600
        "
      >
        {navItems.map((item) => {
          const active = current === item.href || current.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-4 py-2 transition-colors ${
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "hover:text-slate-900"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
