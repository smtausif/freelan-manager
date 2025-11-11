"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProjectTodo from "@/components/ProjectTodo";

type Project = {
  id: string;
  name: string;
  client?: { name?: string | null } | null;
  status:
    | "ACTIVE"
    | "ON_HOLD"
    | "COMPLETED"
    | "HANDED_OVER"
    | "CANCELLED"
    | "CANCELLED_BY_CLIENT"
    | "CANCELLED_BY_FREELANCER";
  isArchived?: boolean;
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();   
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/projects", { cache: "no-store" });
        const all = (await r.json()) as Project[];
        setProject(all.find((x) => x.id === id) ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="text-slate-600">Loading…</div>;
  if (!project) return <div className="text-slate-600">Project not found.</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{project.name}</h1>
        <div className="text-sm text-slate-500">
          {project.client?.name ?? "No client"} • {project.status.replaceAll("_", " ")}
          {project.isArchived ? " • archived" : ""}
        </div>
      </div>

      <ProjectTodo projectId={id} />
    </div>
  );
}
