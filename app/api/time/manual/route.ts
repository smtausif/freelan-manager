// app/api/time/manual/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  if (!u) throw new Error("Demo user not found");
  return u.id;
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const { projectId, description, start, end, durationMin } = await req.json();

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // derive duration if not provided but start/end are
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

  // If no start provided, default to “now - dur”
  if (!startDate) startDate = new Date();
  if (!dur && !endDate) dur = 60; // default 60 min if nothing given

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
}
