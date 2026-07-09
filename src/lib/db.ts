import { PrismaClient } from "@prisma/client";

// Module-level singleton so warm serverless function instances reuse one
// connection instead of opening a new one per invocation. See
// docs/ARCHITECTURE.md §8.1.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
