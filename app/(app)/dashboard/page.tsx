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
  totalPaid: number;
  monthlyRevenue: { label: string; total: number; year: number }[];
  clients: ClientRow[];
  projects: ProjectRow[];
};

// ---------------- SMALL ICONS FOR METRIC CARDS ----------------
function IconCurrency() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v10" />
      <path d="M9.2 10.2h4.8a1.6 1.6 0 0 1 0 3.2H10" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M6 4h12v15l-3-2-3 2-3-2-3 2V4z" />
      <path d="M9 8h6" />
      <path d="M9 11h6" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.5" />
    </svg>
  );
}

// ---------------- DONUT CHART ----------------
function DonutChart({
  segments,
  size = 200,
  inner = 88,
  label,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  inner?: number;
  label?: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const [hovered, setHovered] = useState<{
    label: string;
    value: number;
    pct: number;
  } | null>(null);

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
  const formatLabel = (label: string, value: number, pct: number) =>
    total ? `${label} ${value} - ${pct}%` : `${label} ${value}`;

  const paths =
    total === 0
      ? [
          <circle key="empty" cx={R} cy={R} r={R} fill="#f1effd" />,
          <circle key="hole" cx={R} cy={R} r={r} fill="#fff" />,
        ]
      : segments.map((s, i) => {
          if (s.value === 0) return null;
          const angle = (s.value / total) * Math.PI * 2;
          const d = pathForSlice(acc, acc + angle);
          acc += angle;
          const pct = total ? Math.round((s.value / total) * 100) : 0;
          return (
            <path
              key={i}
              d={d}
              fill={s.color}
              onMouseEnter={() => setHovered({ label: s.label, value: s.value, pct })}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered({ label: s.label, value: s.value, pct })}
              onBlur={() => setHovered(null)}
            >
              <title>
                {formatLabel(s.label, s.value, pct)}
              </title>
            </path>
          );
        });

  const hoverLabel = hovered
    ? formatLabel(hovered.label, hovered.value, hovered.pct)
    : total
    ? "Hover a segment to see details"
    : "No project activity yet";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {paths}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm font-medium text-slate-500">Projects</div>
            <div className="text-xl font-semibold text-slate-900">
              {total}
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        {hoverLabel}
      </div>
      <div className="space-y-1 w-full">
        {segments.map((s) => {
          const pct = total ? Math.round((s.value / total) * 100) : 0;
          return (
            <div key={s.label} className="flex items-center gap-2 text-sm text-slate-600">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-slate-700">{s.label}</span>
              <span className="ml-auto text-slate-500 tabular-nums">
                {s.value} {total ? `• ${pct}%` : ""}
              </span>
            </div>
          );
        })}
        {label && <div className="text-xs text-slate-400 mt-2 text-center">{label}</div>}
      </div>
    </div>
  );
}

// ---------------- MULTI-MONTH BAR CHART ----------------
function RevenueChart({
  months,
}: {
  months: { label: string; total: number }[];
}) {
  if (!months.length) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        No billing data yet.
      </div>
    );
  }

  const max = Math.max(1, ...months.map((m) => m.total));
  const barWidth = 36;
  const gap = 28;
  const padX = 36;
  const padTop = 40;
  const padBottom = 44;
  const height = 280;
  const width = padX * 2 + months.length * barWidth + (months.length - 1) * gap;
  const baseline = height - padBottom;
  const chartHeight = height - padTop - padBottom;
  const gridSteps = [0.25, 0.5, 0.75, 1];
  const palette = ["#6366f1", "#a855f7", "#f97316", "#22c55e", "#14b8a6", "#f472b6"];

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full max-w-xl"
      preserveAspectRatio="xMidYMid meet"
    >
      {gridSteps.map((step, i) => {
        const y = baseline - chartHeight * step;
        const label = Math.round(max * step);
        return (
          <g key={i}>
            <line
              x1={padX - 10}
              y1={y}
              x2={width - padX + 10}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={padX - 16}
              y={y + 4}
              textAnchor="end"
              fontSize={11}
              fill="#94a3b8"
            >
              {label.toLocaleString()}
            </text>
          </g>
        );
      })}

      <line
        x1={padX - 8}
        y1={baseline}
        x2={width - padX + 8}
        y2={baseline}
        stroke="#cbd5f5"
        strokeWidth={1.5}
      />

      {months.map((month, idx) => {
        const barHeight = (month.total / max) * chartHeight;
        const x = padX + idx * (barWidth + gap);
        const y = baseline - barHeight;
        const color = palette[idx % palette.length];
        return (
          <g key={`${month.label}-${idx}`}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx={10}
              fill={color}
            />
            <text
              x={x + barWidth / 2}
              y={y - 10}
              textAnchor="middle"
              fontSize={12}
              fill="#1e293b"
              fontWeight={600}
            >
              ${Math.round(month.total).toLocaleString()}
            </text>
            <text
              x={x + barWidth / 2}
              y={baseline + 20}
              textAnchor="middle"
              fontSize={12}
              fill="#64748b"
            >
              {month.label}
            </text>
          </g>
        );
      })}
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
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dollars = (n: number | undefined) =>
    typeof n === "number"
      ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "$0.00";

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

  const monthlyRevenue = data?.monthlyRevenue ?? [];
  const current = monthlyRevenue.length
    ? monthlyRevenue[monthlyRevenue.length - 1].total
    : 0;
  const last = monthlyRevenue.length > 1
    ? monthlyRevenue[monthlyRevenue.length - 2].total
    : 0;
  const delta = current - last;
  const deltaPct = last ? Math.round((delta / last) * 100) : current ? 100 : 0;

  const activeCount = getCount("ACTIVE");
  const onHoldCount = getCount("ON_HOLD");
  const completedCount = getCount("COMPLETED");
  const totalProjects = data?.projects.length ?? 0;
  const totalPaid = data?.totalPaid ?? 0;
  const hoursTracked = data?.hoursTrackedThisMonth ?? 0;
  const overdueCount = data?.overdueCount ?? 0;
  const overdueLabel = `${overdueCount} overdue ${overdueCount === 1 ? "invoice" : "invoices"}`;

  const statCards = [
    {
      title: "Total Due",
      subtitle: loading ? "Unpaid invoices" : overdueLabel,
      value: loading ? "…" : dollars(data?.unpaidTotal),
      icon: <IconCurrency />,
    },
    {
      title: "Total Paid",
      subtitle: "Received payments",
      value: loading ? "…" : dollars(totalPaid),
      icon: <IconReceipt />,
    },
    {
      title: "Active Projects",
      subtitle: "In progress",
      value: loading ? "…" : `${activeCount}`,
      icon: <IconFolder />,
    },
    {
      title: "Hours Tracked",
      subtitle: "This month",
      value: loading
        ? "…"
        : `${hoursTracked.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          })} h`,
      icon: <IconClock />,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Your freelance command center at a glance.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* Top Stats */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {card.title}
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900">
              {card.value}
            </div>
            <div className="mt-1 text-sm text-slate-500">{card.subtitle}</div>
            <div className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              {card.icon}
            </div>
          </div>
        ))}
      </section>

      {/* Overview Section */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
            <p className="text-sm text-slate-500">
              Quick glance at revenue momentum and project mix for this month.
            </p>
          </div>
          <span className="text-sm text-slate-500">
            {loading ? "" : `${totalProjects} projects`}
          </span>
        </div>

        {loading ? (
          <div className="mt-10 flex h-48 items-center justify-center text-sm text-slate-400">
            Loading…
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div>
                <h3 className="mb-4 text-sm font-medium text-slate-600">Revenue Overview</h3>
                <RevenueChart
                  months={monthlyRevenue.map((m) => ({
                    label: `${m.label}`,
                    total: m.total,
                  }))}
                />
              </div>
              <div className="flex flex-col items-center">
                <h3 className="mb-4 text-sm font-medium text-slate-600">Project Status</h3>
                <DonutChart
                  segments={statusCounts}
                  size={220}
                  inner={104}
                  label="Distribution of all projects"
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  This month billed
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {fmtMoney0(current)}
                  <span
                    className={`ml-2 inline-flex items-center gap-1 text-xs font-medium ${
                      delta >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {delta >= 0 ? "▲" : "▼"} {fmtMoney0(Math.abs(delta))} ({deltaPct}%)
                  </span>
                </div>
                <div className="text-xs text-slate-500">vs last month</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Active workload
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {activeCount} active · {onHoldCount} on hold
                </div>
                <div className="text-xs text-slate-500">Project pipeline snapshot</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Completed projects
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  {completedCount} completed total
                </div>
                <div className="text-xs text-slate-500">All-time</div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Clients Overview */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Clients</h2>
          <span className="text-sm text-slate-500">
            {loading ? "" : `${data?.clients.length ?? 0} total`}
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
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
                  <td className="px-4 py-3 text-slate-400" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && (data?.clients.length ?? 0) === 0 && (
                <tr>
                  <td className="px-4 py-3 text-slate-400" colSpan={6}>
                    No clients yet.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.clients.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
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
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setProjFilter(s)}
                className={`${styles.dashBtn} ${
                  projFilter === s ? styles.dashBtnActive : ""
                }`}
              >
                {s.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
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
                  <td className="px-4 py-3 text-slate-400" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && projectsFiltered.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-slate-400" colSpan={5}>
                    No projects found.
                  </td>
                </tr>
              )}
              {!loading &&
                projectsFiltered.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.client?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-block">
                        {statusChip(p.status, p.isArchived)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
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

        <p className="text-xs text-slate-500 mt-2">
          Read-only overview of all projects. Use the Projects page to modify or
          update status.
        </p>
      </div>
    </div>
  );
}
