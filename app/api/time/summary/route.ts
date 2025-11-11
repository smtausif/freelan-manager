// app/api/time/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

  //  Load rounding from the User -> settings relation (no prisma.userSettings)
  const rounding: "NONE" | "NEAREST_5" | "NEAREST_15" =
    user.settings?.rounding ?? "NONE";

  const round = (m: number) =>
    rounding === "NEAREST_5" ? Math.round(m / 5) * 5
    : rounding === "NEAREST_15" ? Math.round(m / 15) * 15
    : m;

    const whereBase = {
      userId: user.id,
      end: { not: null },
      ...(from ? { start: { gte: new Date(from) } } : {}),
      ...(to ? { start: { lte: new Date(to) } } : {}),
    } as const;

    const projectIds = await prisma.timeEntry.findMany({
      where: whereBase,
      select: { projectId: true },
      distinct: ["projectId"],
    });

    const results = await Promise.all(
      projectIds
        .filter((p) => p.projectId)
        .map(async ({ projectId }) => {
          const entries = await prisma.timeEntry.findMany({
            where: { ...whereBase, projectId: projectId! },
            orderBy: { start: "desc" },
            select: { description: true, start: true, end: true, durationMin: true },
          });

          let totalMin = 0;
          for (const e of entries) {
            const raw =
              e.durationMin ??
              (e.end ? Math.round((+new Date(e.end) - +new Date(e.start)) / 60000) : 0);
            totalMin += round(Math.max(0, raw));
          }

          const entryCount = entries.length;
          const recentDescriptions = entries
            .slice(0, 3)
            .map((r) => r.description?.trim() || "No description");

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
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/time/summary", e);
    return NextResponse.json({ error: "Failed to load time summary" }, { status: 500 });
  }
}
