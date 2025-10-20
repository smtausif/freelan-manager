// app/api/time/stop/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  if (!u) throw new Error("Demo user not found");
  return u.id;
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const { entryId } = await req.json().catch(() => ({} as any));

  // Find the running entry (or use provided entryId)
  const running =
    entryId
      ? await prisma.timeEntry.findFirst({ where: { id: entryId, userId, end: null } })
      : await prisma.timeEntry.findFirst({ where: { userId, end: null } });

  if (!running) {
    return NextResponse.json({ error: "No running timer" }, { status: 409 });
  }

  const end = new Date();
  const durationMs = end.getTime() - new Date(running.start).getTime();
  const durationMin = Math.max(1, Math.round(durationMs / 60000)); // at least 1 min

  const updated = await prisma.timeEntry.update({
    where: { id: running.id },
    data: { end, durationMin },
    include: { project: { include: { client: true } } },
  });

  return NextResponse.json(updated);
}
