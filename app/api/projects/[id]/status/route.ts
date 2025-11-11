// app/api/projects/[id]/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
  const projectId = params.id;
  const body = await req.json().catch(() => ({}));
  const status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "HANDED_OVER" = body?.status;

  const ALLOWED = new Set(["ACTIVE", "ON_HOLD", "COMPLETED", "HANDED_OVER"]);
  if (!ALLOWED.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Only archive on final states (handed over or cancellations).
  // COMPLETED is NOT final — keep it unarchived so user can still hand over or revert.
  const shouldArchive = status === "HANDED_OVER";

  const data: {
    status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "HANDED_OVER";
    isArchived: boolean;
    handedOverAt: Date | null;
  } = {
    status,
    isArchived: shouldArchive ? true : false,
    handedOverAt: status === "HANDED_OVER" ? new Date() : null,
  };

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const updated = await prisma.project.update({
    where: { id: project.id },
    data,
    select: { id: true, status: true, isArchived: true, handedOverAt: true },
  });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("PATCH /api/projects/[id]/status", e);
    return NextResponse.json({ error: "Failed to update project status" }, { status: 500 });
  }
}
