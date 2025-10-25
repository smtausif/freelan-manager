import { prisma } from "@/lib/prisma";
import ProjectTodo from "@/components/ProjectTodo";

export default async function ProjectDetail({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { client: true },
  });

  if (!project) return <div className="p-6">Project not found.</div>;

  return (
    <div className="space-y-6">
      <div className="rounded border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-gray-600 mt-1">
          {project.client?.name ?? "—"} • {project.billingType}
          {project.hourlyRate ? ` @ $${project.hourlyRate}/h` : ""}
          {project.fixedFee ? ` • $${project.fixedFee}` : ""}
        </p>
      </div>

      {/* To-Do list for this project */}
      <ProjectTodo projectId={project.id} />
    </div>
  );
}
