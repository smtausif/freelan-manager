// app/api/time/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

async function getUserId() {
  const u = await prisma.user.findFirst({ where: { email: "demo@fcc.app" } });
  if (!u) throw new Error("Demo user not found");
  return u.id;
}

// DELETE /api/time/:id
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId();
  const id = params.id;

  // ensure it belongs to the user
  const row = await prisma.timeEntry.findFirst({ where: { id, userId } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.timeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
