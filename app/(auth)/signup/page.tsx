"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "../components/AuthCard";

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
    <AuthCard
      eyebrow="Create workspace"
      title="Join TRACKwo"
      subtitle="Spin up your freelance command center in minutes."
    >
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div>
          <label className="text-sm font-medium text-slate-600">Business name</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="organization"
            disabled={loading}
          />
        </div>
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
          <label className="text-sm font-medium text-slate-600">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-slate-900 underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
