//app/api/projects/[id]/tasks/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

export const dynamic = "force-dynamic";

type CreateBody = {
  title: string;
  notes?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null; // ISO yyyy-mm-dd
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const tasks = await prisma.projectTask.findMany({
      where: { projectId: project.id },
      orderBy: [{ status: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(tasks);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/projects/[id]/tasks failed", e);
    // Fail safe in dev: avoid empty responses that crash client parsing
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const project = await prisma.project.findFirst({
      where: { id: params.id, userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const body = (await req.json()) as CreateBody;
    if (!body.title?.trim())
      return NextResponse.json({ error: "Title required" }, { status: 400 });

    const last = await prisma.projectTask.findFirst({
      where: { projectId: project.id },
      orderBy: { order: "desc" },
    });

    const task = await prisma.projectTask.create({
      data: {
        projectId: project.id,
        title: body.title.trim(),
        notes: body.notes?.trim(),
        priority: body.priority ?? "MEDIUM",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        order: (last?.order ?? 0) + 1,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/projects/[id]/tasks failed", e);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
