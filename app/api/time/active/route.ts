// app/api/time/active/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  if (!u) throw new Error("Demo user not found");
  return u.id;
}

// GET /api/time/active -> { active: TimeEntry | null }
export async function GET() {
  const userId = await getUserId();

  const active = await prisma.timeEntry.findFirst({
    where: { userId, end: null },
    include: { project: { include: { client: true } } },
  });

  return NextResponse.json({ active: active ?? null });
}
