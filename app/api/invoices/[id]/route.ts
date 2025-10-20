// app/api/invoices/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

type Params = { params: { id: string } };

// GET one (handy to inspect)
export async function GET(_req: Request, { params }: Params) {
  const inv = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { client: true, project: true, items: true, payments: true, timeEntries: true },
  });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inv);
}

// DELETE (allowed only if NO payments)
// - unlinks time entries (billed=false, invoiceId=null)
// - deletes items, then invoice
export async function DELETE(_req: Request, { params }: Params) {
  const inv = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { payments: true, timeEntries: true },
  });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (inv.payments.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete an invoice that has payments. Refund + VOID it instead." },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    // unlink time entries
    if (inv.timeEntries.length) {
      await tx.timeEntry.updateMany({
        where: { invoiceId: inv.id },
        data: { invoiceId: null, billed: false },
      });
    }
    // delete items
    await tx.invoiceItem.deleteMany({ where: { invoiceId: inv.id } });
    // delete invoice
    await tx.invoice.delete({ where: { id: inv.id } });
  });

  return NextResponse.json({ ok: true, message: "Invoice deleted" });
}
