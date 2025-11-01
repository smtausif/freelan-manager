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
  <div className="mx-auto w-full max-w-6xl px-6 py-5">
    {/* Top row: logo + avatar; nav goes BELOW on small screens */}
    <div className="flex items-center justify-between gap-4">
      <div className="text-2xl font-semibold tracking-tight text-slate-900 shrink-0">
        TRACKwo
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shrink-0">
        N
      </div>
    </div>

    {/* Nav row: full width on mobile; inline on md+ */}
    <div className="mt-3 md:mt-4 md:flex md:items-center">
      {/* basis-0 + flex-1 + min-w-0 = allow shrinking & scrolling */}
      <div className="basis-0 flex-1 min-w-0">
        <NavTabs />
      </div>
    </div>
  </div>
</header>

          <main className="mx-auto w-full max-w-6xl px-6 py-8">
            {children}
          </main>
        </div>

        {/* NEW: global toast portal */}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
