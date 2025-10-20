// app/api/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  return NextResponse.json(client);
}

export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json();
  const client = await prisma.client.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(client);
}

export async function DELETE(_req: Request, { params }: Params) {
  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
