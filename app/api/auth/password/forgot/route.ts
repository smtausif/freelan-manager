import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { lucia } from "@/lib/auth/lucia";
import { cookies } from "next/headers";
import { Argon2id } from "oslo/password";

type Body = {
  email?: string;
  name?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const { email, name, password } = (await request.json().catch(() => ({}))) as Body;
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const storedName = (user?.name ?? "").trim().toLowerCase();
    if (!user || storedName !== name.trim().toLowerCase()) {
      return NextResponse.json({ error: "Account not found for provided email and business name" }, { status: 404 });
    }

    const passwordHash = await new Argon2id().hash(password);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await tx.session.deleteMany({ where: { userId: user.id } });
    });

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/password/forgot", error);
    return NextResponse.json({ error: "Unable to update password" }, { status: 500 });
  }
}
