// app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const existing = await prisma.project.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const project = await prisma.project.update({
      where: { id: existing.id },
      data: body,
      include: { client: true },
    });
    return NextResponse.json(project);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PATCH /api/projects/[id]", e);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.project.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.project.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("DELETE /api/projects/[id]", e);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
