// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
