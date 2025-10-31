"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Client = { id: string; name: string };

type Project = {
  id: string;
  name: string;
  billingType: "HOURLY" | "FIXED";
  hourlyRate?: number | null;
  fixedFee?: number | null;
  status:
    | "ACTIVE"
    | "ON_HOLD"
    | "COMPLETED"
    | "HANDED_OVER"
    | "CANCELLED"
    | "CANCELLED_BY_CLIENT"
    | "CANCELLED_BY_FREELANCER";
  isArchived?: boolean;
  handedOverAt?: string | null;
  client: { id: string; name: string } | null;
};

export default function ProjectsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    clientId: "",
    name: "",
    billingType: "HOURLY" as "HOURLY" | "FIXED",
    hourlyRate: "",
    fixedFee: "",
  });

  async function load() {
    const [c, p] = await Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]);
    setClients(
      (c as Array<{ id: string; name: string }>).map((x) => ({ id: x.id, name: x.name }))
    );
    setProjects(p);
  }

  useEffect(() => {
    load();
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    const body: {
      clientId: string;
      name: string;
      billingType: "HOURLY" | "FIXED";
      hourlyRate?: number | null;
      fixedFee?: number | null;
    } = {
      clientId: form.clientId,
      name: form.name,
      billingType: form.billingType,
    };
    if (form.billingType === "HOURLY") {
      body.hourlyRate = form.hourlyRate ? Number(form.hourlyRate) : null;
    } else {
      body.fixedFee = form.fixedFee ? Number(form.fixedFee) : null;
    }

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) alert(await res.text());

    setForm({ clientId: "", name: "", billingType: "HOURLY", hourlyRate: "", fixedFee: "" });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this project? (Make sure invoices are handled first.)")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    await load();
  }

  async function cancel(id: string, who: "freelancer" | "client") {
    const label = who === "freelancer" ? "Cancel by YOU (void unpaid invoices)" : "Cancel by CLIENT (keep invoices)";
    if (!confirm(`${label}?`)) return;
    const res = await fetch(`/api/projects/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelledBy: who }),
    });
    if (!res.ok) { alert(await res.text()); return; }
    await load();
  }

  async function setStatus(id: string, status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "HANDED_OVER") {
    const nice = status.replaceAll("_", " ");
    if (!confirm(`Set status to "${nice}"?`)) return;
    const res = await fetch(`/api/projects/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { alert(await res.text()); return; }
    await load();
  }

  function statusChip(s: Project["status"], archived?: boolean) {
    const base = "text-xs px-2 py-1 rounded border";
    const map: Record<string, string> = {
      ACTIVE: "bg-green-50 text-green-700 border-green-200",
      ON_HOLD: "bg-amber-50 text-amber-700 border-amber-200",
      COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
      HANDED_OVER: "bg-purple-50 text-purple-700 border-purple-200",
      CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
      CANCELLED_BY_CLIENT: "bg-red-50 text-red-700 border-red-200",
      CANCELLED_BY_FREELANCER: "bg-zinc-100 text-zinc-700 border-zinc-200",
    };
    return (
      <div className="flex items-center gap-2">
        <span className={`${base} ${map[s] || ""}`}>{s.replaceAll("_", " ")}</span>
        {archived ? <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">ARCHIVED</span> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Projects</h1>

      {/* Create project (your original dark inputs retained) */}
      <form onSubmit={createProject} className="grid gap-3 bg-[#111] border border-black/20 rounded-lg p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="bg-[#2e3035] border border-[#3f3f46] rounded-lg px-3 py-2 text-white"
            value={form.clientId}
            onChange={(e) => setForm((v) => ({ ...v, clientId: e.target.value }))}
            required
          >
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input
            className="bg-[#2e3035] border border-[#3f3f46] rounded-lg px-3 py-2 text-white"
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
            required
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="bg-[#2e3035] border border-[#3f3f46] rounded-lg px-3 py-2 text-white"
            value={form.billingType}
            onChange={(e) =>
              setForm((v) => ({
                ...v,
                billingType: e.target.value as "HOURLY" | "FIXED",
                hourlyRate: e.target.value === "HOURLY" ? v.hourlyRate : "",
                fixedFee: e.target.value === "FIXED" ? v.fixedFee : "",
              }))
            }
          >
            <option value="HOURLY">Hourly</option>
            <option value="FIXED">Fixed fee</option>
          </select>

          {form.billingType === "HOURLY" ? (
            <input
              className="bg-[#2e3035] border border-[#3f3f46] rounded-lg px-3 py-2 text-white"
              placeholder="Hourly rate (e.g., 85)"
              value={form.hourlyRate}
              onChange={(e) => setForm((v) => ({ ...v, hourlyRate: e.target.value }))}
              required
            />
          ) : (
            <input
              className="bg-[#2e3035] border border-[#3f3f46] rounded-lg px-3 py-2 text-white"
              placeholder="Fixed fee (e.g., 3200)"
              value={form.fixedFee}
              onChange={(e) => setForm((v) => ({ ...v, fixedFee: e.target.value }))}
              required
            />
          )}
        </div>

        <button className="w-max rounded border border-[#3f3f46] bg-[#1a1a1a] px-3 py-2 text-white hover:bg-[#222]">
          Add Project
        </button>
      </form>

      {/* List */}
      <div className="grid gap-3">
        {projects.map((p) => (
          <div key={p.id} className="bg-[#111] border border-black/20 rounded-lg p-4 flex items-center justify-between">
            <div>
              <Link href={`/projects/${p.id}`} className="font-medium text-lg text-blue-400 hover:underline">
                {p.name}
              </Link>
              <div className="text-sm text-gray-400">
                {p.client?.name ?? "—"} · {p.billingType}
                {p.billingType === "HOURLY" && p.hourlyRate != null ? ` @ $${p.hourlyRate}/h` : ""}
                {p.billingType === "FIXED" && p.fixedFee != null ? ` · $${p.fixedFee}` : ""}
              </div>
              <div className="mt-2">{statusChip(p.status, p.isArchived)}</div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setStatus(p.id, "COMPLETED")} className="px-3 py-1.5 rounded border border-blue-300 text-blue-300 hover:bg-blue-950/30">
                Complete
              </button>
              <button onClick={() => setStatus(p.id, "HANDED_OVER")} className="px-3 py-1.5 rounded border border-purple-300 text-purple-300 hover:bg-purple-950/30">
                Handed Over
              </button>
              <button onClick={() => setStatus(p.id, "ON_HOLD")} className="px-3 py-1.5 rounded border border-amber-300 text-amber-300 hover:bg-amber-950/30">
                On Hold
              </button>
              <button onClick={() => setStatus(p.id, "ACTIVE")} className="px-3 py-1.5 rounded border border-green-300 text-green-300 hover:bg-green-950/30">
                Activate
              </button>
              <button onClick={() => cancel(p.id, "freelancer")} className="px-3 py-1.5 rounded border border-gray-500 text-gray-300 hover:bg-gray-800">
                Cancel (Me)
              </button>
              <button onClick={() => cancel(p.id, "client")} className="px-3 py-1.5 rounded border border-gray-500 text-gray-300 hover:bg-gray-800">
                Cancel (Client)
              </button>
              <button onClick={() => remove(p.id)} className="px-3 py-1.5 rounded border border-red-500 text-red-400 hover:bg-red-900/30">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
