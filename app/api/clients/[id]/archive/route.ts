// app/api/clients/[id]/archive/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

type Params = { params: { id: string } };

export async function POST(_req: Request, { params }: Params) {
  const clientId = params.id;

  // 1️⃣ find client and check invoices
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      invoices: {
        select: { id: true, status: true },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // 2️⃣ check if there are unpaid or partial invoices
  const unpaid = client.invoices.filter(
    (inv) => inv.status !== "PAID" && inv.status !== "VOID"
  );

  if (unpaid.length > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot archive client with active or unpaid invoices. Please mark them as PAID or VOID first.",
        pendingInvoices: unpaid.map((i) => i.id),
      },
      { status: 400 }
    );
  }

  // 3️⃣ mark client + all their projects as archived
  const result = await prisma.$transaction(async (tx) => {
    await tx.project.updateMany({
      where: { clientId },
      data: { isArchived: true },
    });

    const updated = await tx.client.update({
      where: { id: clientId },
      data: { isArchived: true },
    });

    return updated;
  });

  return NextResponse.json({
    ok: true,
    clientId,
    message: "Client archived successfully",
  });
}
