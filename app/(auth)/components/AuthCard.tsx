import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({ eyebrow, title, subtitle, children }: Props) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/85 p-8 text-slate-900 shadow-2xl backdrop-blur">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>

        {children}
      </div>
    </div>
  );
}
