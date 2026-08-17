import type { InsightRepository } from "../../../ports/InsightRepository.js";
import type { Insight } from "../../../domain/insights/Insight.js";
import { prisma } from "./prisma.js";

export class PrismaInsightRepository implements InsightRepository {
  async save(insight: Insight): Promise<void> {
    await prisma.insight.create({
      data: {
        id: insight.id,
        content: insight.content,
        generatedBy: insight.generatedBy,
        createdAt: insight.createdAt,
      },
    });
  }

  async listRecent(limit: number): Promise<Insight[]> {
    const rows = await prisma.insight.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows;
  }
}
