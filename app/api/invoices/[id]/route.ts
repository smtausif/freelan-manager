// app/api/invoices/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

type Params = { params: { id: string } };

// GET one (handy to inspect)
export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const inv = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
      include: { client: true, project: true, items: true, payments: true, timeEntries: true },
    });
    if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(inv);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/invoices/[id]", e);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

// DELETE (allowed only if NO payments)
// - unlinks time entries (billed=false, invoiceId=null)
// - deletes items, then invoice
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const inv = await prisma.invoice.findFirst({
      where: { id: params.id, userId },
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
      if (inv.timeEntries.length) {
        await tx.timeEntry.updateMany({
          where: { invoiceId: inv.id },
          data: { invoiceId: null, billed: false },
        });
      }
      await tx.invoiceItem.deleteMany({ where: { invoiceId: inv.id } });
      await tx.invoice.delete({ where: { id: inv.id } });
    });

    return NextResponse.json({ ok: true, message: "Invoice deleted" });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("DELETE /api/invoices/[id]", e);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
