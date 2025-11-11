// app/api/projects/[id]/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

export const dynamic = "force-dynamic";

type PatchBody = Partial<{
  title: string;
  notes: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null; // ISO
  order: number;
}>;

type TaskUpdateData = {
  title?: string;
  notes?: string | null;
  status?: PatchBody["status"];
  priority?: PatchBody["priority"];
  dueDate?: Date | null;
  order?: number;
};

function buildTaskUpdateData(body: PatchBody): TaskUpdateData {
  const data: TaskUpdateData = {};

  if (typeof body.title === "string") {
    data.title = body.title;
  }
  if ("notes" in body) {
    data.notes = body.notes ?? null;
  }
  if (body.status) {
    data.status = body.status;
  }
  if (body.priority) {
    data.priority = body.priority;
  }
  if ("dueDate" in body) {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  if (typeof body.order === "number") {
    data.order = body.order;
  }

  return data;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    const userId = await requireUserId();
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const body = (await req.json()) as PatchBody;

    const existing = await prisma.projectTask.findFirst({
      where: { id: params.taskId, projectId: project.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = await prisma.projectTask.update({
      where: { id: existing.id },
      data: buildTaskUpdateData(body),
    });

    return NextResponse.json(task);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PATCH /api/projects/[id]/tasks/[taskId]", e);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  try {
    const userId = await requireUserId();
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const existing = await prisma.projectTask.findFirst({
      where: { id: params.taskId, projectId: project.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.projectTask.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("DELETE /api/projects/[id]/tasks/[taskId]", e);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
