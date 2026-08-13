import type { RecommendationRepository } from "../../../ports/RecommendationRepository.js";
import { Recommendation, type RecommendationMode } from "../../../domain/recommendation/Recommendation.js";
import { prisma } from "./prisma.js";

export class PrismaRecommendationRepository implements RecommendationRepository {
  async save(recommendation: Recommendation): Promise<void> {
    const props = recommendation.toProps();
    await prisma.recommendation.upsert({
      where: { id: props.id },
      create: {
        id: props.id,
        targetRef: props.targetRef,
        ruleTriggered: props.ruleTriggered,
        reason: props.reason,
        mode: props.mode,
        executedAt: props.executedAt,
        createdAt: props.createdAt,
      },
      update: {
        mode: props.mode,
        executedAt: props.executedAt,
      },
    });
  }

  async findById(id: string): Promise<Recommendation | null> {
    const row = await prisma.recommendation.findUnique({ where: { id } });
    if (!row) return null;
    return toDomain(row);
  }

  async findRecentTargetRefs(sinceHours: number): Promise<string[]> {
    const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    const rows = await prisma.recommendation.findMany({
      where: { createdAt: { gte: since } },
      select: { targetRef: true },
    });
    return rows.map((r) => r.targetRef);
  }

  async list(filter?: { mode?: RecommendationMode }): Promise<Recommendation[]> {
    const rows = await prisma.recommendation.findMany({
      ...(filter?.mode ? { where: { mode: filter.mode } } : {}),
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toDomain);
  }
}

function toDomain(row: {
  id: string;
  targetRef: string;
  ruleTriggered: string;
  reason: string;
  mode: string;
  executedAt: Date | null;
  createdAt: Date;
}): Recommendation {
  return Recommendation.fromPersisted({
    id: row.id,
    targetRef: row.targetRef,
    ruleTriggered: row.ruleTriggered,
    reason: row.reason,
    mode: row.mode as RecommendationMode,
    executedAt: row.executedAt,
    createdAt: row.createdAt,
  });
}
