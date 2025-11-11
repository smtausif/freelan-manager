import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { lucia } from "@/lib/auth/lucia";
import { requireUserId, UnauthorizedError } from "@/lib/auth/requireUser";

export async function DELETE() {
  try {
    const userId = await requireUserId();

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({
        where: { invoice: { is: { userId } } },
      });
      await tx.invoiceItem.deleteMany({
        where: { invoice: { is: { userId } } },
      });
      await tx.timeEntry.deleteMany({ where: { userId } });
      await tx.projectTask.deleteMany({
        where: { project: { is: { userId } } },
      });
      await tx.invoice.deleteMany({ where: { userId } });
      await tx.project.deleteMany({ where: { userId } });
      await tx.client.deleteMany({ where: { userId } });
      await tx.userSettings.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    const blank = lucia.createBlankSessionCookie();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(blank.name, blank.value, blank.attributes);
    return response;
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("DELETE /api/auth/delete-account", e);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
