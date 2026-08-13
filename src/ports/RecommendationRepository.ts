import type { Recommendation, RecommendationMode } from "../domain/recommendation/Recommendation.js";

export interface RecommendationRepository {
  save(recommendation: Recommendation): Promise<void>;
  findById(id: string): Promise<Recommendation | null>;
  /** Para el chequeo de dedup del motor de reglas: qué se recomendó ya, recientemente. */
  findRecentTargetRefs(sinceHours: number): Promise<string[]>;
  list(filter?: { mode?: RecommendationMode }): Promise<Recommendation[]>;
}
