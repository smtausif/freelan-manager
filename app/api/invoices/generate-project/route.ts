// app/api/invoices/generate-project/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { ensureDevUser } from "@/lib/ensureUser";

// Helpers
function computeDue(issue: Date, terms?: string) {
  const d = new Date(issue);
  switch (terms) {
    case "NET_7": d.setDate(d.getDate() + 7); break;
    case "NET_15": d.setDate(d.getDate() + 15); break;
    case "NET_30": d.setDate(d.getDate() + 30); break;
    case "DUE_ON_RECEIPT":
    default: /* same day */ break;
  }
  return d;
}

export async function POST(req: Request) {
  const user = await ensureDevUser();
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

  // Build line items
  const items: { description: string; quantity: number; unitPrice: number; total: number }[] = [];

  if (project.billingType === "HOURLY") {
    const minutes = entries.reduce((s, e) => {
      const dur =
        e.durationMin ??
        (e.end ? Math.round((+new Date(e.end) - +new Date(e.start)) / 60000) : 0);
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

  // Use UserSettings (currency, taxRate, terms, invoicePrefix/nextNumber)
  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  const currency = settings?.currency ?? "USD";
  const taxRate = Number(settings?.taxRate ?? 0);
  const terms = settings?.terms ?? "NET_15";
  const prefix = settings?.invoicePrefix ?? "";
  const issueDate = new Date();
  const dueDate = computeDue(issueDate, terms);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  // Create invoice AND bump settings.nextNumber atomically
  const invoice = await prisma.$transaction(async (tx) => {
    // Lock & bump nextNumber (fallback to max(number)+1 if missing)
    let nextNumber: number;
    if (settings) {
      nextNumber = settings.nextNumber ?? 1;
      await tx.userSettings.update({
        where: { userId: user.id },
        data: { nextNumber: nextNumber + 1 },
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
        number: nextNumber,       // store the raw number only
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

    // mark entries billed (only for hourly)
    if (project.billingType === "HOURLY" && entries.length) {
      await tx.timeEntry.updateMany({
        where: { id: { in: entries.map((e) => e.id) } },
        data: { billed: true, invoiceId: inv.id },
      });
    }

    return inv;
  });

  // Re-read with relations for client UI
  const full = await prisma.invoice.findUnique({
    where: { id: invoice.id },
    include: { client: true, project: true, items: true, timeEntries: true },
  });

  // Add a computed display number (not stored in DB)
  const displayNumber = prefix ? `${prefix}${full!.number}` : String(full!.number);

  return NextResponse.json({ ...full, displayNumber }, { status: 201 });
}
