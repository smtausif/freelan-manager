// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import NavTabs from "@/components/NavTabs";
// NEW
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[var(--background)] text-[var(--text)]">
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
              <div className="text-2xl font-semibold tracking-tight text-slate-900">
                TRACKwo
              </div>
              <NavTabs />
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                N
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-6 py-8">
            {children}
          </main>
        </div>

        {/* ⬇️ NEW: global toast portal */}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
