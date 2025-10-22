import { prisma } from "@/lib/db";

export async function ensureDevUser() {
  const email = "demo@fcc.app";

  // create if missing
  let user = await prisma.user.upsert({
    where: { email },
    update: {}, // don't overwrite existing values
    create: { email, name: "Demo User" },
  });

  // if taxRate/currency not set on existing user, set sensible defaults
  if (user.taxRate == null || user.currency == null) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        taxRate: user.taxRate ?? 13,   // ----default % here----
        currency: user.currency ?? "USD",
      },
    });
  }

  return user;
}
