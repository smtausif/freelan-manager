// app/api/invoices/export/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

const ALLOWED = ["DRAFT","SENT","PAID","OVERDUE","VOID","PARTIAL"] as const;
type Allowed = typeof ALLOWED[number];

function q(v: unknown) {
  // CSV-safe quoting
  const s = v == null ? "" : String(v);
  const needsQuotes = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status: Allowed | undefined = ALLOWED.includes(statusParam as Allowed)
      ? (statusParam as Allowed)
      : undefined;

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      include: { client: true, project: true, payments: true, items: true },
      orderBy: [{ issueDate: "desc" }, { number: "desc" }],
    });

    // Build flat rows
    const rows = invoices.map((inv) => {
      const amountPaid = Number(inv.amountPaid ?? 0);
      const balance = Math.max(0, Number(inv.total) - amountPaid);
      const first3 =
        inv.items.slice(0, 3).map(i => `${i.description} — ${i.quantity} × $${i.unitPrice} = $${i.total}`).join(" | ") +
        (inv.items.length > 3 ? ` | …+${inv.items.length - 3} more` : "");
      return [
        inv.number,
        inv.status,
        inv.client?.name ?? "",
        inv.project?.name ?? "",
        inv.currency ?? "",
        inv.issueDate?.toISOString?.() ?? new Date(inv.issueDate).toISOString(),
        inv.dueDate?.toISOString?.() ?? new Date(inv.dueDate).toISOString(),
        inv.subtotal.toFixed(2),
        inv.tax.toFixed(2),
        inv.total.toFixed(2),
        amountPaid.toFixed(2),
        balance.toFixed(2),
        first3,
        inv.payments.length, // count of payments
      ];
    });

    const header = [
      "Invoice #",
      "Status",
      "Client",
      "Project",
      "Currency",
      "Issued (ISO)",
      "Due (ISO)",
      "Subtotal",
      "Tax",
      "Total",
      "Amount Paid",
      "Balance",
      "Line Items (preview)",
      "Payments Count",
    ];

    const csv =
      header.map(q).join(",") +
      "\n" +
      rows.map(r => r.map(q).join(",")).join("\n");

    const filename = `invoices_${status ?? "ALL"}_${new Date().toISOString().slice(0,10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("GET /api/invoices/export error:", err);
    return NextResponse.json({ error: "Failed to export invoices" }, { status: 500 });
  }
}
