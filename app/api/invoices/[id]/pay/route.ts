// app/api/invoices/[id]/pay/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import type { InvoiceStatus } from "@prisma/client";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

type Params = { params: { id: string } };

// Body: { amount: number, method?: string, note?: string }
export async function POST(req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { amount, method, note } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "amount must be > 0" }, { status: 400 });
    }

    const inv = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
    });
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

      const newStatus: InvoiceStatus = (
        paid >= inv.total ? "PAID" :
        paid > 0 ? "PARTIAL" :
        inv.status
      ) as InvoiceStatus;

      await tx.invoice.update({
        where: { id: inv.id },
        data: { amountPaid: paid, status: newStatus },
      });
    });

    const updated = await prisma.invoice.findUnique({
      where: { id: inv.id },
      include: { client: true, project: true, items: true, payments: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/invoices/[id]/pay", e);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
