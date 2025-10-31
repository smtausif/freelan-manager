// app/api/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ensure there is a dev user; create if missing
async function ensureDevUserId() {
  const email = "demo@fcc.app";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Demo User" },
  });
  return user.id;
}

export async function GET() {
  try {
    const userId = await ensureDevUserId();

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
    console.error("GET /api/clients", e);
    return NextResponse.json(
      { error: "Failed to load clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await ensureDevUserId();
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
    console.error("POST /api/clients", e);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
