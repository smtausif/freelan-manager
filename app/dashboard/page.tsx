"use client";

import styles from "./dashboard.module.css";
import { useEffect, useMemo, useState } from "react";

// ---------------- TYPES ----------------
type ProjectRow = {
  id: string;
  name: string;
  status:
    | "ACTIVE"
    | "ON_HOLD"
    | "COMPLETED"
    | "HANDED_OVER"
    | "CANCELLED"
    | "CANCELLED_BY_CLIENT"
    | "CANCELLED_BY_FREELANCER";
  isArchived?: boolean;
  billingType: "HOURLY" | "FIXED";
  hourlyRate?: number | null;
  fixedFee?: number | null;
  client: { id: string; name: string } | null;
};

type ClientRow = {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  openBalance: number;
  invoiceCount: number;
  projectCount: number;
};

type DashData = {
  unpaidTotal: number;
  overdueCount: number;
  thisMonthBilledTotal: number;
  lastMonthBilledTotal: number;
  hoursTrackedThisMonth: number;
  clients: ClientRow[];
  projects: ProjectRow[];
};

// ---------------- DONUT CHART ----------------
function DonutChart({
  segments,
  size = 160,
  inner = 64,
  label,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  inner?: number;
  label?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = size / 2;
  const r = inner / 2;

  const polar = (cx: number, cy: number, rad: number, ang: number) => ({
    x: cx + rad * Math.cos(ang),
    y: cy + rad * Math.sin(ang),
  });

  const pathForSlice = (start: number, end: number) => {
    const large = end - start > Math.PI ? 1 : 0;
    const p1 = polar(R, R, R, start);
    const p2 = polar(R, R, R, end);
    const p3 = polar(R, R, r, end);
    const p4 = polar(R, R, r, start);
    return [
      `M ${p1.x} ${p1.y}`,
      `A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${r} ${r} 0 ${large} 0 ${p4.x} ${p4.y}`,
      "Z",
    ].join(" ");
  };

  let acc = -Math.PI / 2;
  const paths =
    total === 0
      ? [
          <circle key="empty" cx={R} cy={R} r={R} fill="#f4f4f5" />,
          <circle key="hole" cx={R} cy={R} r={r} fill="white" />,
        ]
      : segments.map((s, i) => {
          const angle = (s.value / total) * Math.PI * 2;
          const d = pathForSlice(acc, acc + angle);
          acc += angle;
          return <path key={i} d={d} fill={s.color} />;
        });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths}
      </svg>
      <div className="space-y-1">
        {segments.map((s) => {
          const pct = total ? Math.round((s.value / total) * 100) : 0;
          return (
            <div key={s.label} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-3 w-3 rounded"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-gray-300">{s.label}</span>
              <span className="ml-auto text-gray-400 tabular-nums">
                {s.value} {total ? `• ${pct}%` : ""}
              </span>
            </div>
          );
        })}
        {label && <div className="text-xs text-gray-500 mt-2">{label}</div>}
      </div>
    </div>
  );
}

// ---------------- BAR CHART (2 bars, with gridlines) ----------------
function MiniBarChart({
  last,
  current,
  width = 360,
  height = 400,
}: {
  last: number;
  current: number;
  width?: number;
  height?: number;
}) {
  const max = Math.max(1, last, current);
  const pad = 30;
  const innerH = height - pad * 2;
  const barW = 58;
  const x1 = 95;
  const x2 = 205;

  const h1 = (last / max) * innerH;
  const h2 = (current / max) * innerH;
  const y1 = height - pad - h1;
  const y2 = height - pad - h2;

  const gridYs = [0.75, 0.5, 0.25].map((p) => height - pad - innerH * p);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* gridlines */}
      {gridYs.map((y, i) => (
        <line
          key={i}
          x1={pad}
          y1={y}
          x2={width - pad}
          y2={y}
          stroke="#3f3f46"
          strokeWidth={1}
          opacity={0.35}
        />
      ))}

      {/* x-axis */}
      <line
        x1={pad}
        y1={height - pad}
        x2={width - pad}
        y2={height - pad}
        stroke="#a1a1aa"
        strokeWidth={1.5}
        opacity={0.6}
      />

      {/* last month (blue) */}
      <rect x={x1} y={y1} width={barW} height={h1} rx={7} fill="#60a5fa" />
      <text x={x1 + barW / 2} y={y1 - 8} textAnchor="middle" className="text-[12px] fill-gray-300">
        ${Math.round(last).toLocaleString()}
      </text>
      <text x={x1 + barW / 2} y={height - pad + 16} textAnchor="middle" className="text-[12px] fill-gray-400">
        Last Month
      </text>

      {/* this month (green) */}
      <rect x={x2} y={y2} width={barW} height={h2} rx={7} fill="#10b981" />
      <text x={x2 + barW / 2} y={y2 - 8} textAnchor="middle" className="text-[12px] fill-gray-300">
        ${Math.round(current).toLocaleString()}
      </text>
      <text x={x2 + barW / 2} y={height - pad + 16} textAnchor="middle" className="text-[12px] fill-gray-400">
        This Month
      </text>
    </svg>
  );
}

// ---------------- MAIN DASHBOARD PAGE ----------------
export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projFilter, setProjFilter] = useState<ProjectRow["status"] | "ALL">(
    "ALL"
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as DashData;
        setData(json);
      } catch (e: any) {
        setError(e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dollars = (n: number | undefined) =>
    typeof n === "number" ? `$${n.toFixed(2)}` : "$0.00";

  const statusChip = (s: ProjectRow["status"], archived?: boolean) => {
    const base = "text-[10px] px-2 py-0.5 rounded border";
    const map: Record<ProjectRow["status"], string> = {
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
        <span className={`${base} ${map[s]}`}>{s.replaceAll("_", " ")}</span>
        {archived ? (
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
            ARCHIVED
          </span>
        ) : null}
      </div>
    );
  };

  const projectsFiltered = useMemo(() => {
    if (!data) return [];
    const list = data.projects ?? [];
    return projFilter === "ALL" ? list : list.filter((p) => p.status === projFilter);
  }, [data, projFilter]);

  // ---------- Donut data ----------
  const statusCounts = useMemo(() => {
    const counts: Record<ProjectRow["status"], number> = {
      ACTIVE: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
      HANDED_OVER: 0,
      CANCELLED: 0,
      CANCELLED_BY_CLIENT: 0,
      CANCELLED_BY_FREELANCER: 0,
    };
    (data?.projects ?? []).forEach((p) => (counts[p.status] += 1));

    const color: Record<ProjectRow["status"], string> = {
      ACTIVE: "#16a34a",
      ON_HOLD: "#f59e0b",
      COMPLETED: "#3b82f6",
      HANDED_OVER: "#a855f7",
      CANCELLED: "#6b7280",
      CANCELLED_BY_CLIENT: "#ef4444",
      CANCELLED_BY_FREELANCER: "#71717a",
    };

    return (Object.keys(counts) as ProjectRow["status"][]).map((k) => ({
      label: k.replaceAll("_", " "),
      value: counts[k],
      color: color[k],
    }));
  }, [data]);

  const statusOptions: (ProjectRow["status"] | "ALL")[] = [
    "ALL",
    "ACTIVE",
    "ON_HOLD",
    "COMPLETED",
    "HANDED_OVER",
    "CANCELLED",
    "CANCELLED_BY_CLIENT",
    "CANCELLED_BY_FREELANCER",
  ];

  // ---------- Overview helpers ----------
  const fmtMoney0 = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const getCount = (status: ProjectRow["status"]) =>
    (data?.projects ?? []).filter((p) => p.status === status).length;

  const last = data?.lastMonthBilledTotal ?? 0;
  const current = data?.thisMonthBilledTotal ?? 0;
  const delta = current - last;
  const deltaPct = last ? Math.round((delta / last) * 100) : current ? 100 : 0;

  const activeCount = getCount("ACTIVE");
  const onHoldCount = getCount("ON_HOLD");
  const completedCount = getCount("COMPLETED");
  const totalProjects = data?.projects.length ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      {/* Top Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Unpaid Total</div>
          <div className="text-2xl font-semibold">
            {loading ? "…" : dollars(data?.unpaidTotal)}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Overdue</div>
          <div className="text-2xl font-semibold">
            {loading ? "…" : data?.overdueCount ?? 0}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Billed This Month</div>
          <div className="text-2xl font-semibold">
            {loading ? "…" : dollars(data?.thisMonthBilledTotal)}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Hours Tracked (Month)</div>
          <div className="text-2xl font-semibold">
            {loading ? "…" : data?.hoursTrackedThisMonth ?? 0}
          </div>
        </div>
      </div>

      {/* ONE CARD: Bar (left) + Donut (right) + Overview lines */}
      <div className="mt-6 rounded-lg border bg-white/5 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold">Overview</h2>
          <span className="text-sm text-gray-400">
            {loading ? "" : `${totalProjects} projects`}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Quick glance at billing momentum and project mix for this month.
        </p>

        {loading ? (
          <div className="text-sm text-gray-400 text-center">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LEFT: Billing Bar Chart */}
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Billing — Last vs This Month
                </h3>
                <MiniBarChart last={last} current={current} />
              </div>

              {/* RIGHT: Donut */}
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Projects by Status
                </h3>
                <DonutChart
                  segments={statusCounts}
                  size={220}
                  inner={100}
                  label="Distribution of all projects"
                />
              </div>
            </div>

            {/* Overview lines */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-black/10 p-3">
                <div className="text-xs text-gray-400">This month billed</div>
                <div className="text-sm font-semibold">
                  {fmtMoney0(current)}{" "}
                  <span className={delta >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {delta >= 0 ? "▲" : "▼"} {fmtMoney0(Math.abs(delta))} ({deltaPct}%)
                  </span>{" "}
                  vs last month
                </div>
              </div>

              <div className="rounded-md border border-white/10 bg-black/10 p-3">
                <div className="text-xs text-gray-400">Active workload</div>
                <div className="text-sm font-semibold">
                  {activeCount} active · {onHoldCount} on hold
                </div>
              </div>

              <div className="rounded-md border border-white/10 bg-black/10 p-3">
                <div className="text-xs text-gray-400">Completed projects</div>
                <div className="text-sm font-semibold">
                  {completedCount} completed total
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Clients Overview */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Clients</h2>
          <span className="text-sm text-gray-500">
            {loading ? "" : `${data?.clients.length ?? 0} total`}
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Company</th>
                <th className="text-right px-4 py-2">Projects</th>
                <th className="text-right px-4 py-2">Invoices</th>
                <th className="text-right px-4 py-2">Open Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-3 text-gray-400" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && (data?.clients.length ?? 0) === 0 && (
                <tr>
                  <td className="px-4 py-3 text-gray-400" colSpan={6}>
                    No clients yet.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.clients.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.company || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">{c.projectCount}</td>
                    <td className="px-4 py-3 text-right">{c.invoiceCount}</td>
                    <td className="px-4 py-3 text-right">
                      {dollars(c.openBalance)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projects Table */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Projects</h2>
        <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setProjFilter(s as any)}
                className={`${styles.dashBtn} ${
                  projFilter === s ? styles.dashBtnActive : ""
                }`}
              >
                {s.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">Project</th>
                <th className="text-left px-4 py-2">Client</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Billing</th>
                <th className="text-right px-4 py-2">Rate / Fee</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-3 text-gray-400" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && projectsFiltered.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-gray-400" colSpan={5}>
                    No projects found.
                  </td>
                </tr>
              )}
              {!loading &&
                projectsFiltered.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.client?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-block">
                        {statusChip(p.status, p.isArchived)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.billingType}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.billingType === "HOURLY" && p.hourlyRate != null
                        ? `$${p.hourlyRate}/h`
                        : p.billingType === "FIXED" && p.fixedFee != null
                        ? `$${p.fixedFee}`
                        : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Read-only overview of all projects. Use the Projects page to modify or
          update status.
        </p>
      </div>
    </div>
  );
}
