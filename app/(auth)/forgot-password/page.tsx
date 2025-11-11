"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "../components/AuthCard";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsError(false);

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setIsError(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Unable to update password");
      }
      setMessage("Password updated successfully. Redirecting…");
      setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 600);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Unable to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Reset password"
      title="Update your password"
      subtitle="Confirm your business name and email to set a new password instantly."
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
          <label className="text-sm font-medium text-slate-600">Business name</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            disabled={loading}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">New password</label>
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
        <div>
          <label className="text-sm font-medium text-slate-600">Confirm password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={loading}
          />
        </div>

        {message && (
          <div
            className={`rounded-2xl border px-3 py-2 text-sm ${
              isError ? "border-rose-200 bg-rose-50 text-rose-600" : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
            role="alert"
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800"
          disabled={loading}
        >
          {loading ? "Updating password..." : "Update password"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Remembered your password?{" "}
        <Link href="/login" className="text-slate-900 underline">
          Go back to login
        </Link>
      </p>
    </AuthCard>
  );
}
