import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getRequestContext } from "@cloudflare/next-on-pages";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient | null = null;

function getPrismaInstance(): PrismaClient {
  if (prismaInstance) return prismaInstance;

  const isCloudflare = 
    process.env.NODE_ENV === "production" || 
    process.env.CF_PAGES === "1" || 
    typeof (globalThis as any).EdgeRuntime !== "undefined";

  if (isCloudflare) {
    const { env } = getRequestContext() as any;
    const adapter = new PrismaD1(env.DB);
    prismaInstance = new PrismaClient({ adapter });
  } else {
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }
  }

  return prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const instance = getPrismaInstance();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
});
