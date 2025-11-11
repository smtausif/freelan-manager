// app/api/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

export async function GET() {
  try {
    const userId = await requireUserId();

    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        notes: true,
        createdAt: true,   // <-- critical for your chart
        isArchived: true,
      },
    });

    return new NextResponse(JSON.stringify(clients ?? []), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("GET /api/clients", e);
    return NextResponse.json(
      { error: "Failed to load clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();

    const name = (body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        userId,
        name,
        email: body?.email ?? null,
        phone: body?.phone ?? null,
        company: body?.company ?? null,
        notes: body?.notes ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        notes: true,
        createdAt: true,   // <-- returned so UI can use it immediately
        isArchived: true,
      },
    });

    return new NextResponse(JSON.stringify(client), {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("POST /api/clients", e);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
