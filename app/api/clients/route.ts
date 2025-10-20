// app/api/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// TEMP: demo user until auth is added
async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  return u!.id;
}

export async function GET() {
  const userId = await getUserId();
  const clients = await prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      userId,
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      company: body.company ?? null,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(client, { status: 201 });
}
