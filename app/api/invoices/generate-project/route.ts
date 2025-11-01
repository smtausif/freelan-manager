// app/api/invoices/generate-project/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDevUser } from "@/lib/ensureUser";

function computeDue(issue: Date, terms?: string) {
  const d = new Date(issue);
  switch (terms) {
    case "NET_7":
      d.setDate(d.getDate() + 7);
      break;
    case "NET_15":
      d.setDate(d.getDate() + 15);
      break;
    case "NET_30":
      d.setDate(d.getDate() + 30);
      break;
    case "DUE_ON_RECEIPT":
    default:
      // same day
      break;
  }
  return d;
}

type GenerateProjectBody = {
  projectId: string;
  start?: string | Date;
  end?: string | Date;
};

export async function POST(req: NextRequest) {
  const user = await ensureDevUser(); // replace with real auth
  const { projectId, start, end } = (await req.json()) as GenerateProjectBody;

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // project id is unique, so use findUnique
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });
  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const startDate = start ? new Date(start) : undefined;
  const endDate = end ? new Date(end) : undefined;

  // Build a single range object to avoid overwriting "start" in where clause
  const startRange: { gte?: Date; lt?: Date } = {};
  if (startDate) startRange.gte = startDate;
  if (endDate) startRange.lt = endDate;

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: user.id,
      projectId,
      billed: false,
      ...(startDate || endDate ? { start: startRange } : {}),
    },
    orderBy: { start: "asc" },
  });

  // Build line items
  const items: { description: string; quantity: number; unitPrice: number; total: number }[] = [];

  if (project.billingType === "HOURLY") {
    const minutes = entries.reduce((sum, e) => {
      const dur =
        e.durationMin ??
        (e.end ? Math.round((+new Date(e.end) - +new Date(e.start)) / 60000) : 0);
      return sum + Math.max(dur, 0);
    }, 0);

    const hours = minutes / 60;
    const rate = Number(project.hourlyRate ?? 0);

    if (hours > 0 && rate > 0) {
      const qty = Math.round(hours * 100) / 100;
      const total = parseFloat((qty * rate).toFixed(2));
      items.push({
        description: `${project.name} — ${qty.toFixed(2)}h @ $${rate}/h`,
        quantity: qty,
        unitPrice: rate,
        total,
      });
    }
  } else if (project.billingType === "FIXED" && project.fixedFee != null) {
    const fee = Number(project.fixedFee);
    items.push({
      description: `${project.name} — Fixed fee`,
      quantity: 1,
      unitPrice: fee,
      total: fee,
    });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "Nothing to invoice for this project" }, { status: 400 });
  }

  const userWithSettings = await (prisma as any).user.findUnique({
    where: { id: user.id },
    include: { settings: true },
  });
  const settings = userWithSettings?.settings ?? null;

  const currency = settings?.currency ?? "USD";
  const taxRate = Number(settings?.taxRate ?? 0);
  const terms = settings?.terms ?? "NET_15";
  const prefix = settings?.invoicePrefix ?? "";

  const issueDate = new Date();
  const dueDate = computeDue(issueDate, terms);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  // Create invoice and bump nextNumber atomically
  const invoice = await prisma.$transaction(async (tx) => {
    let nextNumber: number;

    if (settings) {
      nextNumber = settings.nextNumber ?? 1;
      await (tx as any).user.update({
        where: { id: user.id },
        data: {
          settings: {
            upsert: {
              update: { nextNumber: (settings?.nextNumber ?? 0) + 1 },
              create: { userId: user.id, nextNumber: (settings?.nextNumber ?? 0) + 1 },
            },
          },
        },
      });
    } else {
      const last = await tx.invoice.findFirst({
        where: { userId: user.id },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      nextNumber = (last?.number ?? 0) + 1;
    }

    const inv = await tx.invoice.create({
      data: {
        userId: user.id,
        clientId: project.clientId,
        projectId: project.id,
        number: nextNumber,
        issueDate,
        dueDate,
        currency,
        subtotal,
        tax,
        total,
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

  const displayNumber = prefix ? `${prefix}${full!.number}` : String(full!.number);
  return NextResponse.json({ ...full, displayNumber }, { status: 201 });
}
