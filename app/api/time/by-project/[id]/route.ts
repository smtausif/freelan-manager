// app/api/time/by-project/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  if (!u) throw new Error("Demo user not found");
  return u.id;
}

// GET /api/time/by-project/:id?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const projectId = params.id;

  const where = {
    userId,
    projectId,
    // finished entries only; keeps numbers stable
    NOT: { end: null as any },
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
}
