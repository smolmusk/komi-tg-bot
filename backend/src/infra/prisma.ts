import type { PrismaClient as PrismaClientType } from "@prisma/client";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new (...args: any[]) => PrismaClientType;
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

prisma
  .$connect()
  .then(() => {
    console.log("Prisma connection established");
  })
  .catch((error: Error) => {
    console.error("Prisma connection error", error);
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
