// app/time/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Project = { id: string; name: string; client: { name: string } | null };
type Entry = {
  id: string;
  projectId: string;
  description?: string | null;
  start: string;
  end?: string | null;
  durationMin?: number | null;
  project?: { name?: string | null; client?: { name?: string | null } | null } | null;
};
type ProjectTotal = {
  projectId: string;
  projectName: string;
  clientName: string;
  totalMin: number;
  entryCount: number;
  recentDescriptions: string[];
};
type ActiveEntry = {
  id: string;
  projectId: string;
  start: string;
  project?: { name?: string | null; client?: { name?: string | null } | null } | null;
};

type RoundMode = "NONE" | "NEAREST_5" | "NEAREST_15";

function roundForDisplay(min: number | null | undefined, mode: RoundMode): number {
  if (!min || min <= 0) return 0;
  if (mode === "NEAREST_5") return Math.round(min / 5) * 5;
  if (mode === "NEAREST_15") return Math.round(min / 15) * 15;
  return min;
}

function fmt(min?: number | null) {
  if (!min || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function preview(descs: string[], maxLen = 90) {
  const text = descs.join(" • ");
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}

function rangeToParams(range: "THIS_MONTH" | "THIS_WEEK" | "ALL_TIME") {
  if (range === "ALL_TIME") return {};
  const now = new Date();

  if (range === "THIS_WEEK") {
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const diff = (day + 6) % 7; // Monday start
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    const next = new Date(monday);
    next.setDate(monday.getDate() + 7);
    return { from: monday.toISOString(), to: next.toISOString() };
  }

  // THIS_MONTH
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from: start.toISOString(), to: end.toISOString() };
}
const rangeQS = (range: "THIS_MONTH" | "THIS_WEEK" | "ALL_TIME") => {
  const p = rangeToParams(range);
  const qs = new URLSearchParams(p as any).toString();
  return qs ? `?${qs}` : "";
};

export default function TimePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");

  const [entries, setEntries] = useState<Entry[]>([]);
  const [totals, setTotals] = useState<ProjectTotal[]>([]);
  const [range, setRange] = useState<"THIS_MONTH" | "THIS_WEEK" | "ALL_TIME">("THIS_MONTH");

  // filters/extras
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [roundMode, setRoundMode] = useState<RoundMode>("NONE");
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState<{ projectId: string; desc: string; start: string; end: string; minutes?: number | "" }>({
    projectId: "",
    desc: "",
    start: "",
    end: "",
    minutes: "",
  });

  // active timer (restored from server)
  const [active, setActive] = useState<ActiveEntry | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const isTracking = !!active;
  const startTime = active ? new Date(active.start) : null;

  async function loadEntries() {
    const res = await fetch("/api/time?limit=200");
    const data = await res.json();
    setEntries(data);
  }
  async function loadTotals() {
    const qs = rangeQS(range);
    const res = await fetch(`/api/time/summary${qs}`);
    const data = await res.json();
    setTotals(data);
  }
  async function loadActive() {
    const res = await fetch("/api/time/active", { cache: "no-store" });
    const data = await res.json();
    setActive(data.active);
  }

  useEffect(() => {
    fetch("/api/projects").then((r) => r.json()).then(setProjects);
    loadEntries();
    loadActive(); // restore running state on first load

    // light polling to keep banner fresh
    pollRef.current = setInterval(loadActive, 30000); // every 30s
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    loadTotals();
  }, [range]);

  const startTimer = async (pid?: string, desc?: string) => {
    const usePid = pid ?? projectId;
    if (!usePid) return alert("Please select a project first!");
    await fetch("/api/time/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: usePid, description: desc ?? description }),
    });
    await Promise.all([loadActive(), loadEntries(), loadTotals()]);
  };

  const stopTimer = async () => {
    await fetch("/api/time/stop", { method: "POST" });
    await Promise.all([loadActive(), loadEntries(), loadTotals()]);
  };

  const removeEntry = async (id: string) => {
    const ok = confirm("Delete this time entry?");
    if (!ok) return;
    await fetch(`/api/time/${id}`, { method: "DELETE" });
    await Promise.all([loadEntries(), loadTotals(), loadActive()]);
  };

  const saveManual = async () => {
    if (!manual.projectId) return alert("Pick a project");
    const payload: any = { projectId: manual.projectId, description: manual.desc };
    if (manual.minutes) payload.durationMin = Number(manual.minutes);
    if (manual.start) payload.start = manual.start;
    if (manual.end) payload.end = manual.end;
    await fetch("/api/time/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setShowManual(false);
    setManual({ projectId: "", desc: "", start: "", end: "", minutes: "" });
    await Promise.all([loadEntries(), loadTotals()]);
  };

  const runningLabel = useMemo(() => {
    if (!isTracking || !startTime) return null;
    const mins = Math.max(1, Math.round((Date.now() - startTime.getTime()) / 60000));
    return fmt(mins);
  }, [isTracking, startTime]);

  // filters
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const pidOk = projectFilter === "ALL" ? true : e.projectId === projectFilter;
      const s = search.trim().toLowerCase();
      const searchOk = s
        ? (e.description || "").toLowerCase().includes(s) ||
          (e.project?.name || "").toLowerCase().includes(s) ||
          (e.project?.client?.name || "").toLowerCase().includes(s)
        : true;
      return pidOk && searchOk;
    });
  }, [entries, projectFilter, search]);

  const listTotal = useMemo(() => {
    const mins = filtered.reduce((sum, e) => sum + roundForDisplay(e.durationMin ?? 0, roundMode), 0);
    return mins;
  }, [filtered, roundMode]);

  // CSV for a project (same as before)
  const exportCsvForProject = async (pid: string) => {
    const res = await fetch(`/api/time/by-project/${pid}${rangeQS(range)}`, { cache: "no-store" });
    if (!res.ok) return alert("Failed to load project logs.");
    const data: {
      project: { name: string; clientName: string };
      entries: { description: string | null; start: string; end: string; durationMin: number | null }[];
    } = await res.json();

    const rows = [
      ["Project", "Client", "Description", "Start", "End", "Minutes"],
      ...data.entries.map((e) => [
        data.project.name,
        data.project.clientName,
        (e.description ?? "").replace(/\n/g, " "),
        new Date(e.start).toISOString(),
        e.end ? new Date(e.end).toISOString() : "",
        String(e.durationMin ?? 0),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.project.name.replace(/\s+/g, "_").toLowerCase()}_time.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-[#0a0a0a] text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Time Tracker</h1>

      {/* Running banner (always visible when active) */}
      {active && (
        <div className="mb-4 rounded-lg border border-[#3f3f46] bg-[#141518] p-4 flex items-center gap-3">
          <div className="text-sm">
            <div className="font-medium">
              Timer running on{" "}
              <span className="text-white">
                {active.project?.name ?? "Untitled"}{" "}
                <span className="text-gray-400">— {active.project?.client?.name ?? "No client"}</span>
              </span>
            </div>
            <div className="text-gray-400 text-xs">started at {new Date(active.start).toLocaleTimeString()} · {runningLabel}</div>
          </div>
          <button onClick={stopTimer} className="ml-auto px-3 py-2 bg-red-600 rounded hover:bg-red-700">
            Stop
          </button>
        </div>
      )}

      {/* Timer card */}
      <div className="space-y-4 bg-[#111] p-6 rounded-lg shadow-md max-w-2xl">
        <select
          className="w-full p-2 rounded bg-[#1b1b1b] border border-gray-600 disabled:opacity-60"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={isTracking} // prevent switching while something runs
        >
          <option value="">Select project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.client?.name ?? "No client"}
            </option>
          ))}
        </select>

        <input
          className="w-full p-2 rounded bg-[#1b1b1b] border border-gray-600"
          placeholder="Work description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isTracking}
        />

        <div className="flex flex-wrap items-center gap-3">
          {!isTracking ? (
            <button onClick={() => startTimer()} className="px-4 py-2 bg-green-600 rounded hover:bg-green-700">
              Start Timer
            </button>
          ) : (
            <button onClick={stopTimer} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700">
              Stop Timer
            </button>
          )}

          <button
            onClick={() => {
              loadEntries();
              loadTotals();
              loadActive();
            }}
            className="px-3 py-2 rounded bg-[#2a2b30] border border-[#3f3f46] hover:bg-[#34363c]"
          >
            Refresh
          </button>

          <div className="ml-auto">
            <button
              onClick={() => setShowManual(true)}
              className="px-3 py-2 rounded bg-[#2a2b30] border border-[#3f3f46] hover:bg-[#34363c]"
            >
              + Add manual
            </button>
          </div>
        </div>
      </div>

      {/* Filters row */}
      <div className="mt-8 flex flex-wrap gap-3 items-center">
        <div className="text-xl font-semibold mr-auto">Recent Entries</div>

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="bg-[#1b1b1b] border border-gray-600 rounded px-2 py-1 text-sm"
        >
          <option value="ALL">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search description / client / project"
          className="bg-[#1b1b1b] border border-gray-600 rounded px-2 py-1 text-sm min-w-[260px]"
        />

        <select
          value={roundMode}
          onChange={(e) => setRoundMode(e.target.value as RoundMode)}
          className="bg-[#1b1b1b] border border-gray-600 rounded px-2 py-1 text-sm"
        >
          <option value="NONE">Rounding: none</option>
          <option value="NEAREST_5">Rounding: nearest 5m</option>
          <option value="NEAREST_15">Rounding: nearest 15m</option>
        </select>
      </div>

      {/* Summary line for current list */}
      <div className="mt-3 text-sm text-gray-300">
        Showing <span className="font-semibold">{filtered.length}</span> log{filtered.length === 1 ? "" : "s"} · Total{" "}
        <span className="font-semibold">{fmt(listTotal)}</span>{" "}
        {roundMode !== "NONE" && <span className="text-gray-400">(rounded)</span>}
      </div>

      {/* Entries list */}
      <div className="mt-3 space-y-2">
        {filtered.length === 0 && <div className="text-sm text-gray-400">No entries match your filters.</div>}
        {filtered.map((e) => {
          const displayMin = roundForDisplay(e.durationMin ?? 0, roundMode);
          return (
            <div
              key={e.id}
              className="rounded-lg border border-[#3f3f46] bg-[#1b1c20] p-3 flex items-center justify-between"
            >
              <div className="min-w-0">
                <div className="font-medium">
                  {e.project?.name ?? "Untitled"}{" "}
                  <span className="text-gray-400">— {e.project?.client?.name ?? "No client"}</span>
                </div>
                <div className="text-sm text-gray-400 truncate max-w-[70ch]">
                  {e.description || "No description"}
                </div>
                <div className="text-xs text-gray-500">{new Date(e.start).toLocaleString()}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold">{e.end ? fmt(displayMin) : "• running"}</div>
                <div className="mt-1 flex gap-2 justify-end">
                  <button
                    onClick={() => removeEntry(e.id)}
                    className="text-xs px-2 py-1 border border-[#444] rounded hover:bg-[#2a2b30]"
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project totals (now with per-project Start/Stop + CSV) */}
      <div className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Project totals</h2>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="bg-[#1b1b1b] border border-gray-600 rounded px-2 py-1 text-sm"
          >
            <option value="THIS_WEEK">This week</option>
            <option value="THIS_MONTH">This month</option>
            <option value="ALL_TIME">All time</option>
          </select>
        </div>

        {totals.length === 0 ? (
          <div className="text-sm text-gray-400">No tracked time in this range.</div>
        ) : (
          <div className="divide-y divide-[#2a2b30] rounded-lg border border-[#3f3f46] overflow-hidden">
            {totals.map((t) => {
              const isThisRunning = active?.projectId === t.projectId;
              return (
                <div key={t.projectId} className="bg-[#121317] px-4 py-3 hover:bg-[#17181d]">
                  <div className="flex items-center justify-between gap-3">
                    {/* Left side → summary link */}
                    <Link
                      href={`/reports/time/${t.projectId}${rangeQS(range)}`}
                      className="min-w-0 flex-1 block"
                    >
                      <div className="font-medium truncate">
                        {t.projectName} <span className="text-gray-400">— {t.clientName}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {t.recentDescriptions.length
                          ? preview(t.recentDescriptions)
                          : `${t.entryCount} log${t.entryCount === 1 ? "" : "s"}`}
                      </div>
                    </Link>

                    {/* Right side → total + start/stop + CSV */}
                    <div className="shrink-0 flex items-center gap-2">
                      <div className="font-semibold">{fmt(t.totalMin)}</div>

                      {!isThisRunning ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startTimer(t.projectId, "");
                          }}
                          className="text-xs px-2 py-1 border border-[#444] rounded hover:bg-[#2a2b30]"
                          title="Start timer on this project"
                          disabled={!!active && !isThisRunning}
                        >
                          Start
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            stopTimer();
                          }}
                          className="text-xs px-2 py-1 border border-[#444] rounded hover:bg-[#2a2b30]"
                          title="Stop current timer"
                        >
                          Stop
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          exportCsvForProject(t.projectId);
                        }}
                        className="text-xs px-2 py-1 border border-[#444] rounded hover:bg-[#2a2b30]"
                        title="Export CSV for this project"
                      >
                        Export CSV
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual add modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg rounded-lg border border-[#3f3f46] bg-[#0f1013] p-5 space-y-4">
            <div className="text-lg font-semibold">Add manual time</div>

            <select
              className="w-full p-2 rounded bg-[#1b1b1b] border border-gray-600"
              value={manual.projectId}
              onChange={(e) => setManual((m) => ({ ...m, projectId: e.target.value }))}
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.client?.name ?? "No client"}
                </option>
              ))}
            </select>

            <input
              className="w-full p-2 rounded bg-[#1b1b1b] border border-gray-600"
              placeholder="Description (optional)"
              value={manual.desc}
              onChange={(e) => setManual((m) => ({ ...m, desc: e.target.value }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="datetime-local"
                className="p-2 rounded bg-[#1b1b1b] border border-gray-600"
                value={manual.start}
                onChange={(e) => setManual((m) => ({ ...m, start: e.target.value }))}
              />
              <input
                type="datetime-local"
                className="p-2 rounded bg-[#1b1b1b] border border-gray-600"
                value={manual.end}
                onChange={(e) => setManual((m) => ({ ...m, end: e.target.value }))}
              />
              <input
                type="number"
                className="p-2 rounded bg-[#1b1b1b] border border-gray-600"
                value={manual.minutes}
                onChange={(e) => setManual((m) => ({ ...m, minutes: e.target.value as any }))}
                placeholder="Duration min (optional)"
              />
            </div>

            <div className="text-xs text-gray-400">
              Tip: set <b>start+end</b> (duration is calculated) or just set <b>duration</b>.
              If neither is set, it defaults to 60 minutes.
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowManual(false)}
                className="px-3 py-2 rounded border border-[#3f3f46] hover:bg-[#191a20]"
              >
                Cancel
              </button>
              <button
                onClick={saveManual}
                className="px-3 py-2 rounded bg-green-600 hover:bg-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
