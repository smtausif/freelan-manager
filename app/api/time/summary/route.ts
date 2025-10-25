// app/api/time/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  if (!u) throw new Error("Demo user not found");
  return u.id;
}

// GET /api/time/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns per-project totals + last 3 time-entry descriptions (NOT todos)
export async function GET(req: Request) {
  const userId = await getUserId();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where = {
    userId,
    // only finished entries (keeps business totals stable)
    NOT: { end: null as any },
    ...(from ? { start: { gte: new Date(from) } } : {}),
    ...(to ? { start: { lte: new Date(to) } } : {}),
  };

  // sum by project
  const grouped = await prisma.timeEntry.groupBy({
    by: ["projectId"],
    where,
    _sum: { durationMin: true },
    _count: { _all: true },
  });

  // attach names + recent time-entry descriptions
  const withMeta = await Promise.all(
    grouped.map(async (g) => {
      const [proj, recent] = await Promise.all([
        prisma.project.findUnique({
          where: { id: g.projectId! },
          include: { client: true },
        }),
        prisma.timeEntry.findMany({
          where: { ...where, projectId: g.projectId! },
          orderBy: { start: "desc" },
          take: 3, // last 3 logs
          select: { description: true },
        }),
      ]);

      return {
        projectId: g.projectId!,
        projectName: proj?.name ?? "Untitled",
        clientName: proj?.client?.name ?? "No client",
        totalMin: g._sum.durationMin ?? 0,
        entryCount: g._count._all,
        recentDescriptions: recent
          .map((r) => (r.description?.trim() || "No description"))
          .filter(Boolean),
      };
    })
  );

  // sort by total time desc
  withMeta.sort((a, b) => b.totalMin - a.totalMin);

  return NextResponse.json(withMeta);
}
