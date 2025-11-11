// app/api/time/start/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const { projectId, description } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // prevent multiple running timers
    const active = await prisma.timeEntry.findFirst({ where: { userId, end: null } });
    if (active) {
      return NextResponse.json({ error: "Timer already running" }, { status: 409 });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        projectId,
        description: description ?? null,
        start: new Date(),
      },
      include: { project: { include: { client: true } } },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/time/start", e);
    return NextResponse.json({ error: "Failed to start timer" }, { status: 500 });
  }
}
