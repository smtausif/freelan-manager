// app/api/time/active/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

// GET /api/time/active -> { active: TimeEntry | null }
export async function GET() {
  try {
    const userId = await requireUserId();

    const active = await prisma.timeEntry.findFirst({
      where: { userId, end: null },
      include: { project: { include: { client: true } } },
    });

    return NextResponse.json({ active: active ?? null });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/time/active", e);
    return NextResponse.json({ error: "Failed to load active timer" }, { status: 500 });
  }
}
