// app/api/time/by-project/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

// GET /api/time/by-project/:id?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const projectId = params.id;

    const where = {
      userId,
      projectId,
      // finished entries only; keeps numbers stable
      end: { not: null },
      ...(from ? { start: { gte: new Date(from) } } : {}),
      ...(to ? { start: { lte: new Date(to) } } : {}),
    };

    const [project, entries] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: { client: true },
      }),
      prisma.timeEntry.findMany({
        where,
        orderBy: { start: "desc" },
        select: {
          id: true,
          description: true,
          start: true,
          end: true,
          durationMin: true,
        },
      }),
    ]);

    const totalMin = entries.reduce((s, e) => s + (e.durationMin ?? 0), 0);
    const avgMin = entries.length ? Math.round(totalMin / entries.length) : 0;

    return NextResponse.json({
      project: {
        id: project?.id,
        name: project?.name ?? "Untitled",
        clientName: project?.client?.name ?? "No client",
      },
      stats: {
        totalMin,
        entryCount: entries.length,
        avgMin,
        range: { from, to },
      },
      entries,
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/time/by-project/[id]", e);
    return NextResponse.json({ error: "Failed to load project time" }, { status: 500 });
  }
}
