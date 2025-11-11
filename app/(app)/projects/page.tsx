"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Client = { id: string; name: string };
type Project = {
  id: string;
  name: string;
  clientId: string | null;
  client?: Client | null;
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
  createdAt?: string;
};

type CreateProjectBody = {
  name: string;
  billingType: Project["billingType"];
  clientId: string | null;
  hourlyRate?: number;
  fixedFee?: number;
};

function prettyBilling(p: Project) {
  if (p.billingType === "HOURLY") {
    const r = p.hourlyRate ?? 0;
    return `Hourly · $${Number(r).toFixed(2)}/hr`;
    }
  const fee = p.fixedFee ?? 0;
  return `Fixed · $${Number(fee).toFixed(2)}`;
}

function StatusBadge({
  status,
  archived,
}: Readonly<{
  status: Project["status"];
  archived?: boolean;
}>) {
  const map: Record<Project["status"], string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ON_HOLD: "bg-amber-50 text-amber-700 border-amber-200",
    COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
    HANDED_OVER: "bg-slate-100 text-slate-700 border-slate-200",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
    CANCELLED_BY_CLIENT: "bg-rose-50 text-rose-700 border-rose-200",
    CANCELLED_BY_FREELANCER: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${map[status]}`}
      title={archived ? "Archived" : undefined}
    >
      {status.replaceAll("_", " ")}
      {archived ? (
        <span className="ml-1 rounded-full bg-slate-300/50 px-1.5 text-[10px] text-slate-700">
          archived
        </span>
      ) : null}
    </span>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | Project["status"]>("ALL");
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);

  // new project form
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [billingType, setBillingType] =
    useState<Project["billingType"]>("HOURLY");
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [fixedFee, setFixedFee] = useState<string>("");

  const [clients, setClients] = useState<Client[]>([]);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/projects", { cache: "no-store" });
      if (!r.ok) {
        console.error("Failed to load projects", r.status, r.statusText);
        setProjects([]);
        return;
      }
      const text = await r.text();
      if (!text.trim()) {
        setProjects([]);
        return;
      }
      const data = JSON.parse(text) as Project[];
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading projects", err);
      setProjects([]);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients", { cache: "no-store" });
      if (!res.ok) {
        console.error("Failed to load clients", res.status, res.statusText);
        setClients([]);
        return;
      }
      const list = (await res.json()) as Client[];
      setClients(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error loading clients", err);
      setClients([]);
    }
  }, []);

  useEffect(() => {
    load();
    loadClients();
  }, [load, loadClients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (!showArchived && p.isArchived) return false;
      if (status !== "ALL" && p.status !== status) return false;
      if (!q) return true;
      const hay = [
        p.name,
        p.client?.name ?? "",
        p.billingType,
        prettyBilling(p),
        p.status,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [projects, search, status, showArchived]);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert("Project name required");

    const body: CreateProjectBody = {
      name: name.trim(),
      billingType,
      clientId: clientId || null,
    };
    if (billingType === "HOURLY")
      body.hourlyRate = Number(hourlyRate || 0);
    if (billingType === "FIXED")
      body.fixedFee = Number(fixedFee || 0);

    const r = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      alert("Failed to create project");
      return;
    }
    setName("");
    setClientId("");
    setHourlyRate("");
    setFixedFee("");
    setBillingType("HOURLY");
    setCreating(false);
    load();
  }

  async function setStatusFor(id: string, s: Project["status"]) {
    const r = await fetch(`/api/projects/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    if (r.ok) load();
  }

  async function cancelProject(id: string, who: "client" | "freelancer") {
    const r = await fetch(`/api/projects/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelledBy: who }),
    });
    if (r.ok) load();
    else alert(await r.text());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Projects
        </h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, clients…"
            className="min-w-[260px] rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm"
          />

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "ALL" | Project["status"])
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="HANDED_OVER">Handed over</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="CANCELLED_BY_CLIENT">Cancelled by client</option>
            <option value="CANCELLED_BY_FREELANCER">Cancelled by freelancer</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="accent-slate-700"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
          <button
            onClick={() => setCreating((s) => !s)}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            {creating ? "Close" : "New Project"}
          </button>
        </div>
      </div>

      {creating && (
        <form
          onSubmit={createProject}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-3 md:grid-cols-4">
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2"
              value={billingType}
              onChange={(e) =>
                setBillingType(e.target.value as Project["billingType"])
              }
            >
              <option value="HOURLY">Hourly</option>
              <option value="FIXED">Fixed</option>
            </select>
            {billingType === "HOURLY" ? (
              <input
                type="number"
                min="0"
                step="0.01"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                placeholder="Hourly rate"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            ) : (
              <input
                type="number"
                min="0"
                step="0.01"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                placeholder="Fixed fee"
                value={fixedFee}
                onChange={(e) => setFixedFee(e.target.value)}
              />
            )}
          </div>
          <div className="mt-3">
            <button className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
              Create
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="text-sm text-slate-500">No matching projects.</div>
        )}

        {filtered.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <Link href={`/projects/${p.id}`} className="min-w-0 group block">
              <div className="truncate text-base font-semibold text-slate-900 group-hover:underline">
                {p.name}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {p.client?.name ?? "—"} • {prettyBilling(p)}
              </div>
              <div className="mt-2">
                <StatusBadge status={p.status} archived={!!p.isArchived} />
              </div>
            </Link>

            {/* Buttons - border only */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStatusFor(p.id, "ACTIVE")}
                className="rounded-full border-2 border-emerald-400/80 px-3 py-1.5 text-sm font-medium text-emerald-300 bg-transparent hover:bg-emerald-950/40 hover:border-emerald-300 transition-colors duration-150"
              >
                Set Active
              </button>

              <button
                onClick={() => setStatusFor(p.id, "ON_HOLD")}
                className="rounded-full border-2 border-amber-400/80 px-3 py-1.5 text-sm font-medium text-amber-300 bg-transparent hover:bg-amber-950/40 hover:border-amber-300 transition-colors duration-150"
              >
                On Hold
              </button>

              <button
                onClick={() => setStatusFor(p.id, "COMPLETED")}
                className="rounded-full border-2 border-blue-400/80 px-3 py-1.5 text-sm font-medium text-blue-300 bg-transparent hover:bg-blue-950/40 hover:border-blue-300 transition-colors duration-150"
              >
                Complete
              </button>

              <button
                onClick={() => setStatusFor(p.id, "HANDED_OVER")}
                className="rounded-full border-2 border-violet-400/80 px-3 py-1.5 text-sm font-medium text-violet-300 bg-transparent hover:bg-violet-950/40 hover:border-violet-300 transition-colors duration-150"
                title="Final; archives project"
              >
                Hand Over
              </button>

              <div className="w-px self-stretch bg-slate-200" />

              <button
                onClick={() => cancelProject(p.id, "client")}
                className="rounded-full border-2 border-rose-400/80 px-3 py-1.5 text-sm font-medium text-rose-300 bg-transparent hover:bg-rose-950/40 hover:border-rose-300 transition-colors duration-150"
                title="Mark cancelled by client"
              >
                Cancel (Client)
              </button>

              <button
                onClick={() => cancelProject(p.id, "freelancer")}
                className="rounded-full border-2 border-slate-400/80 px-3 py-1.5 text-sm font-medium text-slate-300 bg-transparent hover:bg-slate-950/40 hover:border-slate-300 transition-colors duration-150"
                title="Void unpaid invoices, archive"
              >
                Cancel (You)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
