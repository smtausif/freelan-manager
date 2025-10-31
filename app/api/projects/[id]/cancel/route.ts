// app/api/projects/[id]/cancel/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const { cancelledBy } = await req.json(); // "client" or "freelancer"
  const projectId = params.id;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { invoices: { include: { payments: true } } },
  });

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (cancelledBy === "freelancer") {
    // freelancer cancels → void all unpaid invoices
    await prisma.$transaction(async (tx) => {
      await tx.invoice.updateMany({
        where: { projectId, status: { in: ["DRAFT", "SENT"] } },
        data: { status: "VOID" },
      });
      await tx.project.update({
        where: { id: projectId },
        data: { status: "CANCELLED_BY_FREELANCER", isArchived: true },
      });
    });
    return NextResponse.json({ ok: true, who: "freelancer", status: "VOIDED_INVOICES" });
  }

  if (cancelledBy === "client") {
    // client cancels → keep invoices, mark partial/paid
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "CANCELLED_BY_CLIENT", isArchived: true },
    });
    return NextResponse.json({ ok: true, who: "client", status: "KEPT_INVOICES" });
  }

  return NextResponse.json({ error: "Invalid cancel type" }, { status: 400 });
}
