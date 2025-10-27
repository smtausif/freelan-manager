// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="flex min-h-screen">
          <aside className="w-64 bg-white border-r">
            <div className="p-4 font-bold text-xl">TRACKwo</div>
            <nav className="px-2 space-y-1">
              {[
                ["/dashboard", "Dashboard"],
                ["/clients", "Clients"],
                ["/projects", "Projects"],
                ["/time", "Time"],
                ["/invoices", "Invoices"],
                ["/settings", "Settings"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="block rounded px-3 py-2 hover:bg-gray-100"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}