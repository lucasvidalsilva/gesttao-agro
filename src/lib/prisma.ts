import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

const isCloudflare = 
  process.env.NODE_ENV === "production" || 
  process.env.CF_PAGES === "1" || 
  typeof EdgeRuntime !== "undefined";

if (isCloudflare) {
  const { env } = getCloudflareContext();
  const adapter = new PrismaD1(env.DB as any);
  prismaInstance = new PrismaClient({ adapter });
} else {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance;
