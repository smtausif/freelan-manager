// app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
//import { prisma } from "@/lib/db";
import { prisma } from "../../../../lib/db";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const body = await req.json();
  const project = await prisma.project.update({
    where: { id: params.id },
    data: body,
    include: { client: true },
  });
  return NextResponse.json(project);
}

export async function DELETE(_req: Request, { params }: Params) {
  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
