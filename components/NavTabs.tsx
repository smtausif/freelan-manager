"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: Array<{ href: string; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/projects", label: "Projects" },
  { href: "/time", label: "Time" },
  { href: "/invoices", label: "Invoices" },
  { href: "/settings", label: "Settings" },
];

export default function NavTabs() {
  const pathname = usePathname();
  const current = pathname === "/" ? "/dashboard" : pathname;

  return (
    <nav className="flex flex-1 justify-center">
      <div className="flex max-w-xl items-center gap-1 overflow-x-auto rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-sm font-medium text-slate-500">
        {navItems.map((item) => {
          const active =
            current === item.href || current.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 transition-colors duration-150 ${
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
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

