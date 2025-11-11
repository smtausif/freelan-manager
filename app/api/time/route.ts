// app/api/time/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

// GET /api/time?limit=20
export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? "20");

    const entries = await prisma.timeEntry.findMany({
      where: { userId },
      include: { project: { include: { client: true } } },
      orderBy: { start: "desc" },
      take: Math.min(Math.max(limit, 1), 100),
    });

    return NextResponse.json(entries);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/time", e);
    return NextResponse.json({ error: "Failed to load time entries" }, { status: 500 });
  }
}
