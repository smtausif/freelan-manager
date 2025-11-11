"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "../components/AuthCard";

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
    <AuthCard
      eyebrow="Welcome back"
      title="Sign in to TRACKwo"
      subtitle="Enter your credentials to jump back into your workspace."
    >
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div>
          <label className="text-sm font-medium text-slate-600">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>
        <div>
          <div className="flex items-center justify-between text-sm font-medium text-slate-600">
            <span>Password</span>
            <Link href="/forgot-password" className="text-slate-900 underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        {error && (
          <div
            className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Need an account?{" "}
        <Link href="/signup" className="text-slate-900 underline">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}
