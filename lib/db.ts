// lib/db.ts
import { PrismaClient } from "@prisma/client";

// Keep a single PrismaClient instance alive in development.
// This prevents "too many connections" errors during hot reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "warn", "error"],
  });

// Reuse Prisma client during development to avoid creating new instances.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
