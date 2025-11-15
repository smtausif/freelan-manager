"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "../components/AuthCard";
import NetworkBackground from "@/components/NetworkBackground";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@fcc.app");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to sign in");
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      {/* animated tech background */}
      <NetworkBackground />

      {/* top bar */}
      <header className="absolute left-0 right-0 top-0 z-30 border-b border-white/10 bg-black/10 backdrop-blur-md text-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-xs font-bold text-slate-950">
              TW
            </div>
            <span className="text-sm font-semibold tracking-[0.18em] uppercase text-white/80">
              TRACKwo
            </span>
          </Link>

          <Link
            href="/signup"
            className="text-xs font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
          >
            Need an account?
          </Link>
        </div>
      </header>

      {/* centered card */}
      <main className="relative z-20 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <AuthCard
            eyebrow="Welcome back"
            title="Sign in to TRACKwo"
            subtitle="Enter your credentials to jump back into your workspace."
          >
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              aria-busy={loading}
            >
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-white/90 px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  placeholder="you@studio.co"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>Password</span>
                  <Link
                    href="/forgot-password"
                    className="text-slate-900 underline-offset-4 hover:text-slate-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-white/90 px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  disabled={loading}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_35px_rgba(34,197,94,0.5)] ring-1 ring-emerald-300/60 transition hover:translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              Need an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-slate-900 underline-offset-4 hover:text-slate-700 hover:underline"
              >
                Create one
              </Link>
            </p>
          </AuthCard>
        </div>
      </main>
    </div>
  );
}
