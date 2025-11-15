"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NetworkBackground from "@/components/NetworkBackground";

const heroStats = [
  { label: "Projects automated", value: "3,742" },
  { label: "Hours reconciled", value: "18,560" },
  { label: "Avg. faster invoicing", value: "4.6×" },
];

const featureTiles = [
  {
    title: "AI-assisted timelines",
    body: "Predict delivery risk across every client and let the system rebalance your week automatically.",
    accent: "from-indigo-500/20 to-cyan-500/10",
  },
  {
    title: "Sentiment radar",
    body: "Surface tone from email threads and act before a project drifts off-track.",
    accent: "from-fuchsia-500/20 to-amber-500/10",
  },
  {
    title: "Instant handoff kits",
    body: "One click bundles assets, billing, and documentation into a client-ready package.",
    accent: "from-emerald-500/20 to-blue-500/10",
  },
];

const workflow = [
  {
    label: "Capture",
    detail: "Track time, expenses, and project signals live from the command center.",
  },
  {
    label: "Clarify",
    detail: "Auto-generate briefs and client-ready updates pulled from your real data.",
  },
  {
    label: "Close",
    detail: "Send polished invoices, handoff kits, and summaries without leaving the page.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-transparent">
      {/* Animated network background */}
      <NetworkBackground />

      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-transparent backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 text-xs font-bold text-slate-950">
              TW
            </div>
            <span className="text-sm font-semibold tracking-[0.18em] uppercase text-white/80">
              TRACKwo
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <Link href="#features" className="hover:text-white">
              Features
            </Link>
            <Link href="#workflow" className="hover:text-white">
              Workflow
            </Link>
            <Link href="#pricing" className="hover:text-white">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-white/80 hover:text-white sm:inline-block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_10px_35px_rgba(34,197,94,0.45)] ring-1 ring-emerald-300/40 transition hover:translate-y-0.5 hover:brightness-110"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl flex flex-col gap-32 px-6 pb-24 pt-14 lg:pt-20">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/25 backdrop-blur-xl p-10 shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-6"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Freelancer Command Center
            </p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-[56px]">
              Orchestrate every client, every invoice, every handoff,
              without losing the thread.
            </h1>
            <p className="text-lg text-white/70">
              TRACKwo is your backstage staff. It keeps schedules honest,
              nudges clients, packages deliverables, and lets you finish the
              day with zero loose ends.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-2.5 text-base font-semibold text-slate-950 shadow-[0_10px_30px_rgba(34,197,94,0.45)] ring-1 ring-emerald-300/40 transition hover:translate-y-0.5 hover:brightness-110"
              >
                Start free workspace
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-black/20 backdrop-blur-xl px-6 py-2.5 text-base font-semibold text-white/90 transition hover:bg-white/10"
              >
                Launch dashboard
              </Link>
            </div>
          </motion.div>
        </section>

        {/* STATS */}
        <section
          id="features"
          className="grid gap-6 rounded-[28px] border border-white/10 bg-black/20 backdrop-blur-xl p-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {heroStats.map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                {stat.label}
              </p>
              <p className="text-3xl font-semibold">{stat.value}</p>
            </motion.div>
          ))}
        </section>

        {/* FEATURE TILES */}
        <section className="grid gap-6 lg:grid-cols-3">
          {featureTiles.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={`rounded-[28px] border border-white/10 bg-black/20 backdrop-blur-xl p-6 ${feature.accent}`}
            >
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Module {String(idx + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-2xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-base text-white/70">{feature.body}</p>
            </motion.div>
          ))}
        </section>

        {/* WORKFLOW */}
        <section
          id="workflow"
          className="grid items-center gap-10 rounded-[32px] border border-white/10 bg-black/25 backdrop-blur-xl p-10 lg:grid-cols-2"
        >
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Live canvas
            </p>
            <h2 className="text-3xl font-semibold leading-tight lg:text-4xl">
              See your runway, cash, and commitments on a single
              adaptive canvas.
            </h2>
            <p className="text-lg text-white/70">
              We layer financials, task signals, and communication
              tone so you can anticipate the week instead of react to it.
            </p>

            <div className="space-y-4">
              {workflow.map((step, idx) => (
                <div key={step.label} className="flex gap-4">
                  <div className="rounded-full border border-white/30 bg-black/20 backdrop-blur-xl px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="text-base font-semibold">{step.label}</p>
                    <p className="text-sm text-white/70">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          id="pricing"
          className="rounded-[32px] border border-white/10 bg-black/20 backdrop-blur-xl p-10 text-center shadow-[0_25px_60px_rgba(0,0,0,0.4)]"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">
            Ready?
          </p>
          <h2 className="mt-4 text-3xl font-semibold lg:text-4xl">
            Drop the spreadsheets. Invite your clients. End the chaos.
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-lg text-white/70">
            Set up TRACKwo in less than five minutes. Connect Stripe,
            plug in your clients, and let automation do the boring work
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-2.5 text-base font-semibold text-slate-950 shadow-[0_10px_30px_rgba(34,197,94,0.45)] ring-1 ring-emerald-300/40 transition hover:translate-y-0.5 hover:brightness-110"
            >
              Create workspace
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-black/20 backdrop-blur-xl px-6 py-2.5 text-base font-semibold text-white/90 transition hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-cyan-400 text-[10px] font-bold text-slate-950">
                TW
              </div>
              <span className="text-sm font-semibold tracking-[0.18em] uppercase text-white/70">
                TRACKwo
              </span>
            </div>
            <p className="max-w-xs text-xs text-white/50">
              The calm control center for freelancers who treat
              their work like a real business.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-xs text-white/60">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Product
              </span>
              <Link href="#features" className="hover:text-white">
                Features
              </Link>
              <Link href="#workflow" className="hover:text-white">
                Workflow
              </Link>
              <Link href="#pricing" className="hover:text-white">
                Pricing
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Company
              </span>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </div>
          </div>

          <p className="text-[11px] text-white/50">
            © {new Date().getFullYear()} TRACKwo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
