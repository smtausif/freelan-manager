// app/api/invoices/[id]/pay/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

type Params = { params: { id: string } };

// Body: { amount: number, method?: string, note?: string }
export async function POST(req: Request, { params }: Params) {
  const { amount, method, note } = await req.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "amount must be > 0" }, { status: 400 });
  }

  const inv = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: { invoiceId: inv.id, amount, method: method ?? null, note: note ?? null },
    });

    const agg = await tx.payment.aggregate({
      where: { invoiceId: inv.id },
      _sum: { amount: true },
    });
    const paid = Number(agg._sum.amount ?? 0);

    const newStatus =
      paid >= inv.total ? "PAID" :
      paid > 0 ? "PARTIAL" :
      inv.status;

    await tx.invoice.update({
      where: { id: inv.id },
      data: { amountPaid: paid, status: newStatus as any },
    });
  });

  const updated = await prisma.invoice.findUnique({
    where: { id: inv.id },
    include: { client: true, project: true, items: true, payments: true },
  });

  return NextResponse.json(updated);
}
