// components/ProjectTodo.tsx

"use client";
import { useEffect, useMemo, useState } from "react";

type Task = {
  id: string;
  title: string;
  notes?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
};

export default function ProjectTodo({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"LOW"|"MEDIUM"|"HIGH">("MEDIUM");
  const [due, setDue] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/tasks`, { cache: "no-store" });
      if (!r.ok) {
        // If the API returned an error, avoid parsing empty/non‑JSON bodies
        console.error("Failed to load tasks:", r.status, r.statusText);
        setTasks([]);
        return;
      }
      const text = await r.text();
      if (!text || text.trim().length === 0) {
        // Defensive: handle 204/empty responses gracefully
        setTasks([]);
        return;
      }
      const data = JSON.parse(text) as Task[];
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading tasks", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [projectId]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ title, priority, dueDate: due || null })
    });
    setTitle(""); setDue(""); load();
  }
  async function patch(id: string, data: Partial<Task> & { status?: Task["status"] }) {
    await fetch(`/api/projects/${projectId}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(data)
    });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/projects/${projectId}/tasks/${id}`, { method: "DELETE" });
    load();
  }

  const stats = useMemo(() => {
    const total = tasks.length, done = tasks.filter(t=>t.status==="DONE").length;
    return { total, done, pct: total ? Math.round((done/total)*100) : 0 };
  }, [tasks]);

  const cols: Array<{k: Task["status"]; label: string}> = [
    { k:"TODO", label:"To-Do" }, { k:"IN_PROGRESS", label:"In-Progress" }, { k:"DONE", label:"Done" }
  ];

  
  return (
    <div className="rounded-2xl border border-[#2a2a2a] bg-[#121212] p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project To-Dos</h3>
        <div className="text-sm text-gray-400">
          {stats.done}/{stats.total} · {stats.pct}%
        </div>
      </div>
  
      <form onSubmit={addTask} className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
        <input
          className="md:col-span-2 rounded bg-[#1a1a1a] border border-[#333] px-3 py-2 text-white placeholder-gray-500"
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <select
          className="rounded bg-[#1a1a1a] border border-[#333] px-3 py-2 text-white"
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")
          }
        >
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
        </select>
        <input
          className="rounded bg-[#1a1a1a] border border-[#333] px-3 py-2 text-white"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
        <button className="md:col-span-4 rounded bg-[#222] border border-[#333] px-3 py-2 hover:bg-[#2b2b2b] text-white">
          Add Task
        </button>
      </form>
  
      {loading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {cols.map((c) => {
            const list = tasks.filter((t) => t.status === c.k);
            return (
              <div
                key={c.k}
                className="rounded border border-[#2a2a2a] bg-[#181818] p-3"
              >
                <div className="mb-2 text-sm font-medium text-gray-300">
                  {c.label}
                </div>
                {list.length === 0 && (
                  <div className="text-sm text-gray-500">No tasks.</div>
                )}
                <div className="space-y-2">
                  {list.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start justify-between rounded bg-[#202020] px-3 py-2"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={t.status === "DONE"}
                          onChange={() =>
                            patch(t.id, {
                              status: t.status === "DONE" ? "TODO" : "DONE",
                            })
                          }
                          className="mt-1 accent-[#888]"
                        />
                        <div>
                          <div
                            className={`text-sm ${
                              t.status === "DONE"
                                ? "line-through text-gray-500"
                                : "text-white"
                            }`}
                          >
                            {t.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span
                              className={`rounded px-2 py-0.5 ${
                                t.priority === "HIGH"
                                  ? "bg-red-800/40 text-red-300"
                                  : t.priority === "MEDIUM"
                                  ? "bg-yellow-800/40 text-yellow-300"
                                  : "bg-green-800/40 text-green-300"
                              }`}
                            >
                              {t.priority}
                            </span>
                            {t.dueDate && (
                              <span>Due {new Date(t.dueDate).toLocaleDateString()}</span>
                            )}
                            {t.status !== "IN_PROGRESS" && (
                              <button
                                type="button"
                                onClick={() => patch(t.id, { status: "IN_PROGRESS" })}
                                className="underline-offset-2 hover:underline text-blue-400"
                              >
                                Start
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.status !== "TODO" && (
                          <button
                            type="button"
                            onClick={() => patch(t.id, { status: "TODO" })}
                            className="text-xs text-gray-400 hover:text-gray-200"
                          >
                            To-Do
                          </button>
                        )}
                        {t.status !== "IN_PROGRESS" && (
                          <button
                            type="button"
                            onClick={() => patch(t.id, { status: "IN_PROGRESS" })}
                            className="text-xs text-gray-400 hover:text-gray-200"
                          >
                            In-Progress
                          </button>
                        )}
                        {t.status !== "DONE" && (
                          <button
                            type="button"
                            onClick={() => patch(t.id, { status: "DONE" })}
                            className="text-xs text-gray-400 hover:text-gray-200"
                          >
                            Done
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => remove(t.id)}
                          className="text-xs text-gray-500 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
  
}
