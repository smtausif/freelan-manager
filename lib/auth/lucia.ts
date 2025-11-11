import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { prisma } from "@/lib/db";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  },
  getUserAttributes: (user) => ({
    email: user.email,
    name: user.name,
  }),
});

export type Auth = typeof lucia;

declare module "lucia" {
  interface Register {
    Lucia: Auth;
    DatabaseUserAttributes: {
      email: string;
      name: string | null;
    };
  }
}
