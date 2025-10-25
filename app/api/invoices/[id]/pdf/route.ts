// app/api/invoices/[id]/pdf/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type RouteParams = { id: string };

function dollars(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

async function buildPdf(inv: any): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page.getSize();

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // simple cursor
  let y = height - 50;
  const left = 50;
  const right = width - 50;

  const draw = (text: string, x: number, y: number, opts: any = {}) => {
    page.drawText(text, {
      x,
      y,
      size: opts.size ?? 11,
      font: opts.font ?? font,
      color: opts.color ?? rgb(0, 0, 0),
    });
  };

  // Header
  draw(`Invoice #${inv.number}`, left, y, { font: bold, size: 22 });
  draw(`Issued: ${new Date(inv.issueDate).toLocaleDateString()}`, right - 220, y, { size: 10 });
  y -= 16;
  draw(`Due: ${new Date(inv.dueDate).toLocaleDateString()}`, right - 220, y, { size: 10 });
  y -= 28;

  // From / To
  draw("From:", left, y, { font: bold, size: 12 });
  y -= 14;
  draw(inv.user?.businessName ?? "Your Company", left, y);
  y -= 12;
  if (inv.user?.businessAddress) {
    draw(inv.user.businessAddress, left, y);
    y -= 12;
  }
  y -= 10;

  draw("Bill To:", left, y, { font: bold, size: 12 });
  y -= 14;
  draw(inv.client?.name ?? "Unknown client", left, y);
  y -= 12;
  if (inv.project?.name) {
    draw(`Project: ${inv.project.name}`, left, y);
    y -= 12;
  }
  y -= 16;

  // Items header
  draw("Items", left, y, { font: bold, size: 12 });
  y -= 10;
  page.drawLine({
    start: { x: left, y: y },
    end: { x: right, y: y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 14;

  // Items rows
  const priceColX = right - 60;
  const qtyColX = right - 180;
  const unitColX = right - 120;

  // header row
  draw("Description", left, y, { font: bold });
  draw("Qty", qtyColX, y, { font: bold });
  draw("Unit", unitColX, y, { font: bold });
  draw("Total", priceColX, y, { font: bold });
  y -= 14;

  inv.items.forEach((it: any) => {
    draw(String(it.description ?? ""), left, y);
    draw(String(it.quantity ?? 0), qtyColX, y);
    draw(dollars(it.unitPrice ?? 0), unitColX, y);
    draw(dollars(it.total ?? 0), priceColX, y);
    y -= 14;
  });

  y -= 10;
  page.drawLine({
    start: { x: left, y: y },
    end: { x: right, y: y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 16;

  // Totals
  const labelX = right - 160;
  draw("Subtotal", labelX, y);
  draw(dollars(inv.subtotal), right - 60, y);
  y -= 14;

  draw("Tax", labelX, y);
  draw(dollars(inv.tax), right - 60, y);
  y -= 16;

  draw("Total", labelX, y, { font: bold, size: 12 });
  draw(dollars(inv.total), right - 60, y, { font: bold, size: 12 });
  y -= 24;

  draw("Thank you for your business.", left, y, { size: 10, color: rgb(0.35, 0.35, 0.35) });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<RouteParams> } // <-- params is a Promise in Next 15
) {
  // await the params per Next.js 15 requirement
  const { id } = await ctx.params;

  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, project: true, items: true, user: true },
  });
  if (!inv) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const pdf = await buildPdf(inv);

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice_${inv.number}.pdf"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "no-store",
    },
  });
}
