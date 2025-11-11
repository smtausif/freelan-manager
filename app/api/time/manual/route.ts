// app/api/time/manual/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const { projectId, description, start, end, durationMin } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    let dur = durationMin as number | undefined;
    let startDate = start ? new Date(start) : undefined;
    let endDate = end ? new Date(end) : undefined;

    if (!dur && startDate && endDate) {
      const ms = endDate.getTime() - startDate.getTime();
      if (ms <= 0) {
        return NextResponse.json({ error: "end must be after start" }, { status: 400 });
      }
      dur = Math.max(1, Math.round(ms / 60000));
    }

    if (!startDate) startDate = new Date();
    if (!dur && !endDate) dur = 60;

    if (!endDate && dur) {
      endDate = new Date(startDate.getTime() + dur * 60000);
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        projectId,
        description: description ?? null,
        start: startDate!,
        end: endDate!,
        durationMin: dur ?? null,
      },
      include: { project: { include: { client: true } } },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/time/manual", e);
    return NextResponse.json({ error: "Failed to create manual entry" }, { status: 500 });
  }
}
