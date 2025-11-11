// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

export async function GET() {
  try {
    const userId = await requireUserId();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [invoices, clients, projects, timeEntries, projectsExpanded] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        select: {
          id: true, clientId: true, status: true, total: true, amountPaid: true,
          issueDate: true, dueDate: true,
        },
      }),
      prisma.client.findMany({
        where: { userId },
        select: { id: true, name: true, email: true, company: true },
        orderBy: { name: "asc" },
      }),
      prisma.project.findMany({
        where: { userId },
        select: { id: true, clientId: true },
      }),
      prisma.timeEntry.findMany({
        where: { userId, start: { gte: monthStart, lt: nextMonthStart } },
        select: { start: true, end: true, durationMin: true },
      }),
      // NEW: detailed project list for the dashboard
      prisma.project.findMany({
        where: { userId },
        include: { client: { select: { id: true, name: true } } },
        orderBy: [{ isArchived: "asc" }, { createdAt: "desc" }],
      }),
    ]);

    const isOpen = (s: string) => !["PAID", "VOID"].includes(s);

    const totalPaid = invoices.reduce((sum, inv) => {
      const paid = Number(inv.amountPaid ?? 0);
      return sum + paid;
    }, 0);

    const unpaidTotal = invoices.reduce((sum, inv) => {
      if (!isOpen(inv.status)) return sum;
      const paid = inv.amountPaid ?? 0;
      return sum + Math.max(0, Number(inv.total) - Number(paid));
    }, 0);

    const overdueCount = invoices.filter((inv) => {
      if (!isOpen(inv.status)) return false;
      const due = inv.dueDate ? new Date(inv.dueDate) : null;
      return !!due && due < now;
    }).length;

    const invoiceTotalsByMonth = new Map<string, number>();
    invoices.forEach((inv) => {
      if (!inv.issueDate) return;
      const issued = new Date(inv.issueDate);
      const key = `${issued.getFullYear()}-${issued.getMonth()}`;
      const running = invoiceTotalsByMonth.get(key) ?? 0;
      invoiceTotalsByMonth.set(key, running + Number(inv.total ?? 0));
    });

    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const monthlyRevenue = Array.from({ length: 6 }, (_, idx) => {
      const offset = 5 - idx;
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${firstOfMonth.getFullYear()}-${firstOfMonth.getMonth()}`;
      const total = invoiceTotalsByMonth.get(key) ?? 0;
      return {
        label: monthFormatter.format(firstOfMonth),
        year: firstOfMonth.getFullYear(),
        total: +Number(total).toFixed(2),
      };
    });

    const thisMonthBilledTotal = monthlyRevenue[monthlyRevenue.length - 1]?.total ?? 0;
    const lastMonthBilledTotal = monthlyRevenue[monthlyRevenue.length - 2]?.total ?? 0;

    const minutesThisMonth = timeEntries.reduce((m, t) => {
      if (t.durationMin != null) return m + t.durationMin;
      if (t.start && t.end) {
        const ms = +new Date(t.end) - +new Date(t.start);
        return m + Math.max(0, Math.round(ms / 60000));
      }
      return m;
    }, 0);
    const hoursTrackedThisMonth = +(minutesThisMonth / 60).toFixed(2);

    const projByClient = new Map<string, number>();
    projects.forEach((p) => projByClient.set(p.clientId, (projByClient.get(p.clientId) ?? 0) + 1));

    const invByClient = new Map<string, { count: number; open: number }>();
    invoices.forEach((inv) => {
      const key = inv.clientId ?? "__none__";
      const cur = invByClient.get(key) ?? { count: 0, open: 0 };
      cur.count += 1;
      if (isOpen(inv.status)) {
        const paid = inv.amountPaid ?? 0;
        cur.open += Math.max(0, Number(inv.total) - Number(paid));
      }
      invByClient.set(key, cur);
    });

    const clientSummaries = clients.map((c) => {
      const invAgg = invByClient.get(c.id) ?? { count: 0, open: 0 };
      const projectCount = projByClient.get(c.id) ?? 0;
      return {
        id: c.id, name: c.name, email: c.email, company: c.company,
        openBalance: +invAgg.open.toFixed(2),
        invoiceCount: invAgg.count,
        projectCount,
      };
    });

    // Build a lean project payload for the UI
    const projectList = projectsExpanded.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status as
        | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "HANDED_OVER"
        | "CANCELLED" | "CANCELLED_BY_CLIENT" | "CANCELLED_BY_FREELANCER",
      isArchived: p.isArchived,
      billingType: p.billingType as "HOURLY" | "FIXED",
      hourlyRate: p.hourlyRate,
      fixedFee: p.fixedFee,
      client: p.client ? { id: p.client.id, name: p.client.name } : null,
    }));

    return NextResponse.json({
      unpaidTotal: +unpaidTotal.toFixed(2),
      overdueCount,
      thisMonthBilledTotal: +thisMonthBilledTotal.toFixed(2),
      lastMonthBilledTotal: +lastMonthBilledTotal.toFixed(2),
      hoursTrackedThisMonth,
      totalPaid: +totalPaid.toFixed(2),
      monthlyRevenue,
      clients: clientSummaries,
      projects: projectList,
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/dashboard error:", e);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
