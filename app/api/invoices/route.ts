// app/api/invoices/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureDevUser } from "@/lib/ensureUser"; 

// GET /api/invoices?status=DRAFT|SENT|PAID|OVERDUE|VOID|PARTIAL&projectId=...
export async function GET(req: Request) {
  try {
    const user = await ensureDevUser();       // ← ensures demo user exists (with taxRate if you set it there)
    const userId = user.id;

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const allowed = ["DRAFT","SENT","PAID","OVERDUE","VOID","PARTIAL"] as const;
    type Status = typeof allowed[number];
    const isStatus = (s: string | null): s is Status =>
      !!s && (allowed as readonly string[]).includes(s);
    const status = isStatus(statusParam) ? statusParam : undefined;
    const projectId = searchParams.get("projectId") ?? undefined;

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
        ...(projectId ? { projectId } : {}),
      },
      include: { client: true, project: true, items: true, payments: true },
      orderBy: [{ issueDate: "desc" }, { number: "desc" }],
    });

    return NextResponse.json(invoices ?? []);
  } catch (e) {
    console.error("GET /api/invoices error:", e);
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 });
  }
}
