import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { lucia } from "@/lib/auth/lucia";
import { cookies } from "next/headers";
import { Argon2id } from "oslo/password";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    const valid = await new Argon2id().verify(user.passwordHash, password);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    const cookieStore = await cookies();
    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/login", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
