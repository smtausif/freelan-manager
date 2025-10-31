// app/api/projects/[id]/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PatchBody = Partial<{
  title: string;
  notes: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null; // ISO
  order: number;
}>;

export async function PATCH(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const body = (await req.json()) as PatchBody;

  const task = await prisma.projectTask.update({
    where: { id: params.taskId },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.status ? { status: body.status } : {}),
      ...(body.priority ? { priority: body.priority } : {}),
      ...(body.dueDate !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
      ...(body.order !== undefined ? { order: body.order } : {}),
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  await prisma.projectTask.delete({ where: { id: params.taskId } });
  return NextResponse.json({ ok: true });
}
