// app/api/time/start/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  if (!u) throw new Error("Demo user not found. Did you run the seed?");
  return u.id;
}

export async function POST(req: Request) {
  const userId = await getUserId();
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
}
