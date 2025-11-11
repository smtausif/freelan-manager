// app/clients/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  currency?: string | null;
  notes?: string | null;
  createdAt?: string; // from API
  isArchived?: boolean;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

// utils for charting last vs this month
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getLastTwoMonthsData(clients: { createdAt?: string }[]) {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const counts = new Map<string, number>();
  for (const c of clients) {
    if (!c.createdAt) continue;
    const dt = new Date(c.createdAt);
    if (Number.isNaN(dt.getTime())) continue;
    const key = monthKey(new Date(dt.getFullYear(), dt.getMonth(), 1));
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const lmKey = monthKey(lastMonth);
  const tmKey = monthKey(thisMonth);
  const lm = counts.get(lmKey) || 0;
  const tm = counts.get(tmKey) || 0;

  return {
    lm,
    tm,
    data: [
      { name: "Last month", value: lm },
      { name: "This month", value: tm },
    ],
    delta: tm - lm,
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "company" | "newest">("name");
  const [editing, setEditing] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/clients", { cache: "no-store" });
    if (!res.ok) {
      toast.error("Failed to load clients");
      return;
    }
    const data = (await res.json()) as Client[];
    setClients(data);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = clients;

    if (q) {
      arr = arr.filter((c) =>
        [c.name, c.email, c.phone, c.company, c.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    const byText = (a?: string | null, b?: string | null) =>
      (a || "").localeCompare(b || "", undefined, { sensitivity: "base" });

    arr = [...arr].sort((a, b) => {
      if (sort === "name") return byText(a.name, b.name);
      if (sort === "company") return byText(a.company, b.company);
      // “newest”: prefer createdAt, then id as fallback
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (ad !== bd) return bd - ad;
      return b.id.localeCompare(a.id);
    });

    return arr;
  }, [clients, search, sort]);

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      toast.error("Failed to add client");
      return;
    }
    toast.success("Client added");
    setForm({ name: "", email: "", phone: "", company: "", notes: "" });
    await load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    setClients((prev) => prev.filter((c) => c.id !== id));
    toast.success("Client deleted");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);

    // optimistic
    setClients((prev) =>
      prev.map((c) => (c.id === editing.id ? { ...c, ...editing } : c))
    );

    const res = await fetch(`/api/clients/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editing.name,
        email: editing.email ?? null,
        phone: editing.phone ?? null,
        company: editing.company ?? null,
        notes: editing.notes ?? null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      toast.error("Save failed");
      await load(); // revert optimistic
      return;
    }
    toast.success("Client updated");
    setEditing(null);
  }

  function Badge({
    label,
    color,
  }: {
    label: string;
    color: "slate" | "amber";
  }) {
    const map: Record<string, string> = {
      slate: "bg-slate-100 text-slate-700 border-slate-200",
      amber: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[color]}`}
      >
        {label}
      </span>
    );
  }

  function initials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase())
      .join("");
  }

  const { lm, tm, data: chartData, delta } = getLastTwoMonthsData(clients);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Clients
        </h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
            {clients.length} total
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm"
            title="Sort"
          >
            <option value="name">Sort: Name</option>
            <option value="company">Sort: Company</option>
            <option value="newest">Sort: Newest</option>
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, email…"
            className="min-w-[260px] rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Stats + Line Chart */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-1">
          <div className="text-sm text-slate-500">Clients added</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {tm}{" "}
            <span className="text-sm text-slate-500 align-middle">
              this month
            </span>
          </div>
          <div
            className={`mt-1 text-sm ${
              delta > 0
                ? "text-emerald-600"
                : delta === 0
                ? "text-slate-600"
                : "text-rose-600"
            }`}
          >
            {delta > 0 ? "▲" : delta === 0 ? "—" : "▼"} {Math.abs(delta)} vs
            last month ({lm})
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2">
          <div className="mb-2 text-sm text-slate-500">Last 2 months</div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}`, "Clients"]}
                  cursor={{ stroke: "rgba(15, 23, 42, 0.12)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#0ea5e9" }}
                  activeDot={{ r: 6, fill: "#0284c7" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Add Client */}
      <form
        onSubmit={createClient}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-2 text-sm font-medium text-slate-800">Add client</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              placeholder="Name *"
              value={form.name}
              onChange={(e) =>
                setForm((v) => ({ ...v, name: e.target.value }))
              }
              required
            />
            <p className="text-xs text-slate-500">Full name or team contact</p>
          </div>

          <div className="space-y-1.5">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm((v) => ({ ...v, email: e.target.value }))
              }
            />
            <p className="text-xs text-slate-500">
              Shown on invoices and notifications
            </p>
          </div>

          <div className="space-y-1.5">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm((v) => ({ ...v, phone: e.target.value }))
              }
            />
            <p className="text-xs text-slate-500">Optional</p>
          </div>

          <div className="space-y-1.5">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              placeholder="Company"
              value={form.company}
              onChange={(e) =>
                setForm((v) => ({ ...v, company: e.target.value }))
              }
            />
            <p className="text-xs text-slate-500">Shown on project headers</p>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2"
              placeholder='Notes (type "VIP" to flag)'
              value={form.notes}
              onChange={(e) =>
                setForm((v) => ({ ...v, notes: e.target.value }))
              }
            />
            <p className="text-xs text-slate-500">
              e.g., “VIP, Net 15, prefers email”
            </p>
          </div>
        </div>
        <div className="mt-3">
          <button className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 text-sm font-medium">
            Add Client
          </button>
        </div>
      </form>

      {/* List */}
      <div className="grid gap-3">
        {filtered.map((c, index) => {
          const vip = (c.notes || "").toLowerCase().includes("vip");
          const initialsStr = initials(c.name || "?");
          return (
            <div
              key={c.id}
              className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                vip
                  ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-semibold opacity-0"
                  style={{
                    animation: "fadeInUp .25s ease forwards",
                    animationDelay: `${Math.min(0.5, 0.03 * index)}s`,
                  }}
                >
                  {initialsStr || "?"}
                </div>

                {/* Main */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <div className="truncate text-base font-semibold text-slate-900">
                      {c.name}
                    </div>
                    {c.company ? <Badge label={c.company} color="slate" /> : null}
                    {vip ? <Badge label="VIP" color="amber" /> : null}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <a
                      href={c.email ? `mailto:${c.email}` : undefined}
                      className={`hover:underline ${
                        c.email ? "" : "pointer-events-none text-slate-400"
                      }`}
                    >
                      {c.email || "—"}
                    </a>
                    <span className="text-slate-300">•</span>
                    <a
                      href={c.phone ? `tel:${c.phone}` : undefined}
                      className={`hover:underline ${
                        c.phone ? "" : "pointer-events-none text-slate-400"
                      }`}
                    >
                      {c.phone || "—"}
                    </a>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">
                      ID #{c.id.slice(0, 6)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditing({
                        id: c.id,
                        name: c.name,
                        email: c.email ?? "",
                        phone: c.phone ?? "",
                        company: c.company ?? "",
                        notes: c.notes ?? "",
                        createdAt: c.createdAt,
                      })
                    }
                    className="rounded-full border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="rounded-full border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Collapsible notes */}
              {c.notes ? (
                <details className="mt-3 group">
                  <summary className="cursor-pointer list-none text-sm text-slate-700 hover:underline">
                    Notes
                    <span className="ml-1 text-slate-400 group-open:hidden">
                      (show)
                    </span>
                    <span className="ml-1 text-slate-400 hidden group-open:inline">
                      (hide)
                    </span>
                  </summary>
                  <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {c.notes}
                  </div>
                </details>
              ) : null}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
            <div className="text-slate-800 font-medium">No clients found</div>
            <div className="text-slate-500 text-sm">
              Try a different search or add a new client.
            </div>
          </div>
        )}
      </div>

      {/* Edit Drawer (animated) */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="w-full md:max-w-xl rounded-t-2xl md:rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-semibold text-slate-900">
                  Edit client
                </div>
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-full border px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <form onSubmit={saveEdit} className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 md:col-span-2"
                  placeholder="Name"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  required
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                  placeholder="Email"
                  value={editing.email || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, email: e.target.value })
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                  placeholder="Phone"
                  value={editing.phone || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, phone: e.target.value })
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                  placeholder="Company"
                  value={editing.company || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, company: e.target.value })
                  }
                />
                <textarea
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 md:col-span-2 h-28"
                  placeholder='Notes (e.g., "VIP, Net 15, prefers email")'
                  value={editing.notes || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value })
                  }
                />
                <div className="mt-1 md:col-span-2">
                  <button
                    disabled={saving}
                    className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 text-sm font-medium disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* tiny keyframe used for avatar fade-in */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
