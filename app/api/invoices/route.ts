// app/api/invoices/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  if (!u) throw new Error("Demo user not found");
  return u.id;
}

// GET /api/invoices?status=DRAFT|SENT|PAID|OVERDUE|VOID|PARTIAL&projectId=...
export async function GET(req: Request) {
  const userId = await getUserId();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as
    | "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "VOID" | "PARTIAL" | null;
  const projectId = searchParams.get("projectId") || undefined;

  const invoices = await prisma.invoice.findMany({
    where: { userId, ...(status ? { status } : {}), ...(projectId ? { projectId } : {}) },
    include: { client: true, project: true, items: true, payments: true },
    orderBy: [{ issueDate: "desc" }, { number: "desc" }],
  });

  return NextResponse.json(invoices);
}
