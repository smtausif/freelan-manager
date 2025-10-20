"use client";
import { useState, useEffect } from "react";

type Project = { id: string; name: string; client: { name: string } | null };
type Entry = {
  id: string;
  description?: string | null;
  start: string;
  end?: string | null;
  durationMin?: number | null;
  project?: { name?: string | null; client?: { name?: string | null } | null } | null;
};

export default function TimePage() {
  const [isTracking, setIsTracking] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);

  const [entries, setEntries] = useState<Entry[]>([]);

  function fmt(min?: number | null) {
    if (!min || min <= 0) return "—";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }

  async function loadEntries() {
    const res = await fetch("/api/time?limit=20");
    const data = await res.json();
    setEntries(data);
  }

  useEffect(() => {
    // Load projects + recent entries
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data));
    loadEntries();
  }, []);

  const startTimer = async () => {
    if (!projectId) {
      alert("Please select a project first!");
      return;
    }
    setIsTracking(true);
    setStartTime(new Date());
    const res = await fetch("/api/time/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, description }),
    });
    await res.json();
    await loadEntries();
  };

  const stopTimer = async () => {
    setIsTracking(false);
    const res = await fetch("/api/time/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    await res.json();
    await loadEntries();
  };

  return (
    <div className="p-6 bg-[#0a0a0a] text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Time Tracker</h1>

      {/* Timer card */}
      <div className="space-y-4 bg-[#111] p-6 rounded-lg shadow-md max-w-md">
        {/* project dropdown */}
        <select
          className="w-full p-2 rounded bg-[#1b1b1b] border border-gray-600"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">Select project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.client?.name ?? "No client"}
            </option>
          ))}
        </select>

        {/* description */}
        <input
          className="w-full p-2 rounded bg-[#1b1b1b] border border-gray-600"
          placeholder="Work description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* buttons */}
        <div className="flex gap-4">
          {!isTracking ? (
            <button
              onClick={startTimer}
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
            >
              Start Timer
            </button>
          ) : (
            <button
              onClick={stopTimer}
              className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
            >
              Stop Timer
            </button>
          )}
          <button
            onClick={loadEntries}
            className="px-3 py-2 rounded bg-[#2a2b30] border border-[#3f3f46] hover:bg-[#34363c]"
          >
            Refresh
          </button>
        </div>

        {startTime && isTracking && (
          <p className="text-gray-400 text-sm">
            Started at: {startTime.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Recent entries */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Recent Entries</h2>
        <div className="space-y-2">
          {entries.length === 0 && (
            <div className="text-sm text-gray-400">No entries yet.</div>
          )}
          {entries.map((e) => (
            <div
              key={e.id}
              className="rounded-lg border border-[#3f3f46] bg-[#1b1c20] p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">
                  {e.project?.name ?? "Untitled"}{" "}
                  <span className="text-gray-400">
                    — {e.project?.client?.name ?? "No client"}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {e.description || "No description"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {e.end ? fmt(e.durationMin) : "• running"}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(e.start).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
