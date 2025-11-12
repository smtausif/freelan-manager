"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-[#01010A] text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(93,63,211,0.35),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(20,184,166,0.25),_transparent_55%)] blur-3xl" />
      </div>

      <main className="mx-auto flex max-w-6xl flex-col gap-32 px-6 pb-32 pt-20 lg:pt-28">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl space-y-6"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">
              Freelancer Command Center
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-[56px]">
              Orchestrate every client, every invoice, every handoff—
              without losing the thread.
            </h1>
            <p className="text-lg text-white/70">
              TRACKwo is your backstage staff: it keeps schedules honest, nudges
              clients, packages deliverables, and lets you finish the day with
              zero loose ends.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/dashboard"
                className="rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
              >
                Launch dashboard
              </Link>
            </div>
          </motion.div>

          <div className="pointer-events-none absolute -right-16 top-12 hidden lg:block">
            <motion.div
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative h-80 w-80 rounded-[32px] bg-gradient-to-br from-indigo-400/60 via-sky-400/60 to-emerald-400/60 p-1"
            >
              <div className="flex h-full w-full flex-col justify-between rounded-[28px] bg-slate-950/95 p-6">
                <div className="space-y-1">
                  <p className="text-sm text-white/60">Live workload</p>
                  <h3 className="text-3xl font-semibold">12 active briefs</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-emerald-300">On-time handoffs</p>
                  <h3 className="text-4xl font-semibold text-emerald-200">93%</h3>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                    Next
                  </p>
                  <p className="text-lg font-semibold text-white">
                    Invoice review · 3:00p
                  </p>
                </div>
              </div>
              <motion.div
                className="absolute -bottom-6 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 blur-md"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
              />
            </motion.div>
          </div>
        </section>

        <section className="grid gap-6 rounded-[28px] border border-white/10 bg-white/5 p-6 sm:grid-cols-2 lg:grid-cols-3">
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

        <section className="grid gap-6 lg:grid-cols-3">
          {featureTiles.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={`rounded-[28px] border border-white/10 bg-gradient-to-br ${feature.accent} p-6`}
            >
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Module {idx + 1}
              </p>
              <h3 className="mt-3 text-2xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-base text-white/70">{feature.body}</p>
            </motion.div>
          ))}
        </section>

        <section className="grid items-center gap-10 rounded-[32px] border border-white/10 bg-white/5 p-10 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">
              Live canvas
            </p>
            <h2 className="text-3xl font-semibold leading-tight lg:text-4xl">
              See your runway, cash, and commitments on a single adaptive
              canvas.
            </h2>
            <p className="text-lg text-white/70">
              We layer financials, task signals, and communication tone so you
              can anticipate the week instead of react to it. Every module is
              tuned to freelancers running multiple high-touch accounts.
            </p>
            <div className="space-y-4">
              {workflow.map((step, idx) => (
                <div key={step.label} className="flex gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-base font-semibold">{step.label}</p>
                    <p className="text-sm text-white/70">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <motion.div
              className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-[0_40px_90px_rgba(0,0,0,0.65)] backdrop-blur"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Revenue Pulse
                  </p>
                  <p className="text-2xl font-semibold">$47,930</p>
                  <p className="text-xs text-emerald-300">+12% vs. last month</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Deep work
                  </p>
                  <p className="text-2xl font-semibold">26 hrs</p>
                  <p className="text-xs text-white/60">Booked this week</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-white/10 bg-gradient-to-r from-sky-500/20 to-emerald-500/10 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Upcoming handoffs
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Beta Studio – Brand drop</span>
                      <span className="text-white/70">Thu · 4:00p</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Arcade Labs – Audit</span>
                      <span className="text-white/70">Fri · 9:30a</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-rose-500 to-purple-500 blur-2xl"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 6 }}
            />
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Ready?</p>
          <h2 className="mt-4 text-3xl font-semibold lg:text-4xl">
            Drop the spreadsheets. Invite your clients. End the chaos.
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-lg text-white/70">
            Set up TRACKwo in less than five minutes. Plug in your projects,
            connect Stripe, and let automations handle the busywork while you
            stay in flow.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
