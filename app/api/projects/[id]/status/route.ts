// app/api/projects/[id]/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
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

  const updated = await prisma.project.update({
    where: { id: projectId },
    data,
    select: { id: true, status: true, isArchived: true, handedOverAt: true },
  });

  return NextResponse.json(updated);
}
