import type { SystemConfigRepository } from "../../../ports/SystemConfigRepository.js";
import { prisma } from "./prisma.js";

export class PrismaSystemConfigRepository implements SystemConfigRepository {
  async get(key: string): Promise<string | null> {
    const row = await prisma.systemConfig.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await prisma.systemConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}
