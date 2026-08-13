import type { RecommendationRepository } from "../ports/RecommendationRepository.js";
import type { Recommendation, RecommendationMode } from "../domain/recommendation/Recommendation.js";

export class ListRecommendations {
  constructor(private readonly recommendationRepo: RecommendationRepository) {}

  execute(filter?: { mode?: RecommendationMode }): Promise<Recommendation[]> {
    return this.recommendationRepo.list(filter);
  }
}
