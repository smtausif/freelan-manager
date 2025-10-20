// app/api/invoices/[id]/status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

type Params = { params: { id: string } };

// Body: { status: "SENT" | "VOID" | "PAID" }
export async function POST(req: Request, { params }: Params) {
  const { status } = (await req.json()) as { status: "SENT" | "VOID" | "PAID" };

  const inv = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { payments: true },
  });
  if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  if (status === "VOID") {
    // Only allow void if there are NO payments at all
    if (inv.payments.length > 0) {
      return NextResponse.json(
        { error: "Cannot VOID an invoice that has payments. Refund first, or mark PAID." },
        { status: 400 }
      );
    }
    const updated = await prisma.invoice.update({
      where: { id: inv.id },
      data: { status: "VOID" },
    });
    return NextResponse.json(updated);
  }

  if (status === "SENT") {
    const updated = await prisma.invoice.update({
      where: { id: inv.id },
      data: { status: "SENT" },
    });
    return NextResponse.json(updated);
  }

  if (status === "PAID") {
    // Auto-settle remaining balance by creating a payment for the difference (if any)
    const amountPaid = inv.amountPaid ?? 0;
    const remaining = Math.max(0, inv.total - amountPaid);

    await prisma.$transaction(async (tx) => {
      if (remaining > 0) {
        await tx.payment.create({
          data: { invoiceId: inv.id, amount: remaining, method: "Manual Auto-Settle" },
        });
      }
      await tx.invoice.update({
        where: { id: inv.id },
        data: { amountPaid: inv.total, status: "PAID" },
      });
    });

    const full = await prisma.invoice.findUnique({
      where: { id: inv.id },
      include: { payments: true },
    });
    return NextResponse.json(full);
  }

  return NextResponse.json({ error: "Invalid status" }, { status: 400 });
}
