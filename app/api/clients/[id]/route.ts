// app/api/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

type Params = { params: { id: string } };

function cleanString(v: unknown) {
  if (typeof v === "string") return v.trim() === "" ? null : v.trim();
  return v ?? null;
}

function pickAllowed(body: any) {
  return {
    name: typeof body.name === "string" ? body.name.trim() : undefined,
    email: cleanString(body.email),
    phone: cleanString(body.phone),
    company: cleanString(body.company),
    notes: cleanString(body.notes),
  };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const client = await prisma.client.findFirst({
      where: { id: params.id, userId },
    });
    if (!client) {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.json(client, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return new NextResponse(e?.message || "Server error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const raw = await req.json();
    const data = pickAllowed(raw);

    Object.keys(data).forEach(
      (k) => (data as any)[k] === undefined && delete (data as any)[k]
    );

    if (Object.keys(data).length === 0) {
      return new NextResponse("No valid fields", { status: 400 });
    }

    const existing = await prisma.client.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) {
      return new NextResponse("Not found", { status: 404 });
    }

    const updated = await prisma.client.update({
      where: { id: existing.id },
      data,
    });

    return NextResponse.json(updated, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    if (e instanceof UnauthorizedError) {
      return new NextResponse(e.message, { status: e.status });
    }
    if (e?.code === "P2025") {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse(e?.message || "Update failed", { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.client.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) {
      return new NextResponse("Not found", { status: 404 });
    }

    await prisma.client.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    if (e instanceof UnauthorizedError) {
      return new NextResponse(e.message, { status: e.status });
    }
    if (e?.code === "P2025") {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse(e?.message || "Delete failed", { status: 400 });
  }
}
