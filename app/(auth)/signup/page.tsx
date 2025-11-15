"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "../components/AuthCard";
import NetworkBackground from "@/components/NetworkBackground";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to sign up");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent">
      {/* animated background */}
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
            href="/login"
            className="text-xs font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
          >
            Already have an account?
          </Link>
        </div>
      </header>

      {/* center card */}
      <main className="relative z-20 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <AuthCard
            eyebrow="Create workspace"
            title="Join TRACKwo"
            subtitle="Spin up your freelance command center in minutes."
          >
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              aria-busy={loading}
            >
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Business name
                </label>
                <input
                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-white/90 px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="organization"
                  disabled={loading}
                  placeholder="Studio Arcade, Beta Labs..."
                />
              </div>

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
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="password"
                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-white/90 px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 shadow-sm outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  placeholder="At least 8 characters"
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
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-slate-900 underline-offset-4 hover:text-slate-700 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </AuthCard>
        </div>
      </main>
    </div>
  );
}
