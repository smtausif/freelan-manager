// app/api/time/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  if (!u) throw new Error("Demo user not found");
  return u.id;
}

// GET /api/time?limit=20
export async function GET(req: Request) {
  const userId = await getUserId();
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "20");

  const entries = await prisma.timeEntry.findMany({
    where: { userId },
    include: { project: { include: { client: true } } },
    orderBy: { start: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
  });

  return NextResponse.json(entries);
}
