import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error"] });

if (process.env.DATA_GUARD === "on") {
  (prisma as any).$use(async (params: any, next: any) => {
    const PROTECTED = new Set(["Tenant","Point","User","Role","UserRole","Permission","RolePermission"]);
    const BLOCKED = new Set(["delete","deleteMany","executeRaw","queryRaw"]);
    if (params.model && PROTECTED.has(params.model) && BLOCKED.has(params.action)) {
      throw new Error(`[DATA_GUARD] Blocked ${params.action} on ${params.model}`);
    }
    if (params.action === "deleteMany" && (!params.args || !params.args.where)) {
      throw new Error("[DATA_GUARD] deleteMany without where");
    }
    return next(params);
  });
}

if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;
