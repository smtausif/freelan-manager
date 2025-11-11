// app/api/time/stop/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    let entryId: string | undefined;
    try {
      const body = (await req.json()) as { entryId?: string };
      entryId = body.entryId;
    } catch {
      entryId = undefined;
    }

    const running =
      entryId
        ? await prisma.timeEntry.findFirst({ where: { id: entryId, userId, end: null } })
        : await prisma.timeEntry.findFirst({ where: { userId, end: null } });

    if (!running) {
      return NextResponse.json({ error: "No running timer" }, { status: 409 });
    }

    const end = new Date();
    const durationMs = end.getTime() - new Date(running.start).getTime();
    const durationMin = Math.max(1, Math.round(durationMs / 60000));

    const updated = await prisma.timeEntry.update({
      where: { id: running.id },
      data: { end, durationMin },
      include: { project: { include: { client: true } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/time/stop", e);
    return NextResponse.json({ error: "Failed to stop timer" }, { status: 500 });
  }
}
