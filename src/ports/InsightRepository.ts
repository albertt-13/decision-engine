import type { Insight } from "../domain/insights/Insight.js";

export interface InsightRepository {
  save(insight: Insight): Promise<void>;
  listRecent(limit: number): Promise<Insight[]>;
}
