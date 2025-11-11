import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { lucia } from "@/lib/auth/lucia";
import { cookies } from "next/headers";
import { Argon2id } from "oslo/password";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
    }

    const passwordHash = await new Argon2id().hash(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: typeof name === "string" && name.trim() ? name.trim() : null,
        passwordHash,
      },
    });

    await prisma.userSettings.create({ data: { userId: user.id } });

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/signup", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
