// app/api/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ensure there is a dev user; create if missing
async function ensureDevUserId() {
  const email = "demo@fcc.app";

  // upsert needs a UNIQUE constraint on User.email
  // prisma model should have: email String @unique
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
      orderBy: { createdAt: "desc" }, // ok if Client.createdAt exists; else remove
      select: { id: true, name: true, email: true, phone: true, company: true, notes: true },
    });
    return NextResponse.json(clients ?? []);
  } catch (e) {
    console.error("GET /api/clients", e);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
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
      select: { id: true, name: true, email: true, phone: true, company: true, notes: true },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (e) {
    console.error("POST /api/clients", e);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
