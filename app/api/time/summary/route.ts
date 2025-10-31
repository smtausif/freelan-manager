// app/api/time/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

async function getUser() {
  // mirrors your other endpoints that use the demo email
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  if (!u) throw new Error("Demo user not found");
  return u;
}

export async function GET(req: Request) {
  const user = await getUser();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Load rounding preference from settings
  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
    select: { rounding: true },
  });
  const rounding = settings?.rounding ?? "NONE";
  const round = (m: number) =>
    rounding === "NEAREST_5" ? Math.round(m / 5) * 5
    : rounding === "NEAREST_15" ? Math.round(m / 15) * 15
    : m;

  const whereBase = {
    userId: user.id,
    end: { not: null }, // business totals should use finished entries only
    ...(from ? { start: { gte: new Date(from) } } : {}),
    ...(to ? { start: { lte: new Date(to) } } : {}),
  } as const;

  // Get the distinct projectIds that have entries in range
  const projectIds = await prisma.timeEntry.findMany({
    where: whereBase,
    select: { projectId: true },
    distinct: ["projectId"],
  });

  const results = await Promise.all(
    projectIds
      .filter((p) => p.projectId) // ignore nulls
      .map(async ({ projectId }) => {
        // fetch entries for this project (to apply per-entry rounding)
        const entries = await prisma.timeEntry.findMany({
          where: { ...whereBase, projectId: projectId! },
          orderBy: { start: "desc" },
          select: { description: true, start: true, end: true, durationMin: true },
        });

        // sum with rounding applied to each entry
        let totalMin = 0;
        for (const e of entries) {
          const raw =
            e.durationMin ??
            (e.end ? Math.round((+new Date(e.end) - +new Date(e.start)) / 60000) : 0);
          totalMin += round(Math.max(0, raw));
        }

        const entryCount = entries.length;
        const recentDescriptions = entries.slice(0, 3).map((e) => (e.description?.trim() || "No description"));

        const proj = await prisma.project.findUnique({
          where: { id: projectId! },
          include: { client: true },
        });

        return {
          projectId: projectId!,
          projectName: proj?.name ?? "Untitled",
          clientName: proj?.client?.name ?? "No client",
          totalMin,
          entryCount,
          recentDescriptions,
        };
      })
  );

  results.sort((a, b) => b.totalMin - a.totalMin);

  return NextResponse.json(results);
}
