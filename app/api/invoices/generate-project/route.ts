// app/api/invoices/generate-project/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { ensureDevUser } from "@/lib/ensureUser";

async function getUser() {
  return ensureDevUser();
}

// Body: { projectId: string, start?: string, end?: string }
export async function POST(req: Request) {
  const user = await getUser();
  const { projectId, start, end } = await req.json();

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    include: { client: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const startDate = start ? new Date(start) : undefined;
  const endDate = end ? new Date(end) : undefined;

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: user.id,
      projectId,
      billed: false,
      ...(startDate ? { start: { gte: startDate } } : {}),
      ...(endDate ? { start: { lt: endDate } } : {}),
    },
    orderBy: { start: "asc" },
  });

  const items: { description: string; quantity: number; unitPrice: number; total: number }[] = [];

  if (project.billingType === "HOURLY") {
    const minutes = entries.reduce((s, e) => {
      const dur = e.durationMin ?? (e.end ? Math.round((+new Date(e.end) - +new Date(e.start)) / 60000) : 0);
      return s + Math.max(dur, 0);
    }, 0);
    const hours = minutes / 60;
    const rate = Number(project.hourlyRate ?? 0);
    if (hours > 0 && rate > 0) {
      items.push({
        description: `${project.name} — ${hours.toFixed(2)}h @ $${rate}/h`,
        quantity: Math.round(hours * 100) / 100,
        unitPrice: rate,
        total: parseFloat((hours * rate).toFixed(2)),
      });
    }
  } else if (project.billingType === "FIXED" && project.fixedFee != null) {
    items.push({
      description: `${project.name} — Fixed fee`,
      quantity: 1,
      unitPrice: Number(project.fixedFee),
      total: Number(project.fixedFee),
    });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "Nothing to invoice for this project" }, { status: 400 });
  }

  const last = await prisma.invoice.findFirst({
    where: { userId: user.id },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const nextNumber = (last?.number ?? 0) + 1;

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const taxRate = Number(user.taxRate ?? 0);
  const tax = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        userId: user.id,
        clientId: project.clientId,
        projectId: project.id,
        number: nextNumber,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        currency: user.currency ?? "USD",
        subtotal, tax, total,
        status: "DRAFT",
      },
    });

    await tx.invoiceItem.createMany({
      data: items.map((i) => ({
        invoiceId: inv.id,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.total,
      })),
    });

    if (project.billingType === "HOURLY" && entries.length) {
      await tx.timeEntry.updateMany({
        where: { id: { in: entries.map((e) => e.id) } },
        data: { billed: true, invoiceId: inv.id },
      });
    }

    return inv;
  });

  const full = await prisma.invoice.findUnique({
    where: { id: invoice.id },
    include: { client: true, project: true, items: true, timeEntries: true },
  });

  return NextResponse.json(full, { status: 201 });
}
