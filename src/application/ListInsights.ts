import type { InsightRepository } from "../ports/InsightRepository.js";
import type { Insight } from "../domain/insights/Insight.js";

const DEFAULT_LIMIT = 20;

export class ListInsights {
  constructor(private readonly insightRepo: InsightRepository) {}

  execute(limit: number = DEFAULT_LIMIT): Promise<Insight[]> {
    return this.insightRepo.listRecent(limit);
  }
}
