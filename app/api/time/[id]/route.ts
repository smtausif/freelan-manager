// app/api/time/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

// DELETE /api/time/:id
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const id = params.id;

    const row = await prisma.timeEntry.findFirst({ where: { id, userId } });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.timeEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("DELETE /api/time/[id]", e);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
