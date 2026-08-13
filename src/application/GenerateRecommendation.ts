import { randomUUID } from "node:crypto";
import type { DataSource } from "../ports/DataSource.js";
import type { RecommendationRepository } from "../ports/RecommendationRepository.js";
import type { SystemConfigRepository } from "../ports/SystemConfigRepository.js";
import type { RateLimiter } from "../ports/RateLimiter.js";
import type { ProductProfileRepository } from "../ports/ProductProfileRepository.js";
import { Recommendation, type RecommendationMode } from "../domain/recommendation/Recommendation.js";
import { evaluateRecommendationRules } from "../domain/recommendation/RecommendationRules.js";
import { isValidExecutionMode, isWithinLiveModeGuardrail, type ExecutionMode } from "../domain/executionMode/ExecutionMode.js";

const EXECUTION_MODE_KEY = "execution_mode";
const LIVE_GUARDRAIL_KEY = "live-mode:executed:hourly";
const LIVE_GUARDRAIL_WINDOW_SECONDS = 60 * 60;
const RECENT_DEDUP_WINDOW_HOURS = 24;
const BESTSELLERS_LIMIT = 10;

/**
 * Caso de uso: corre el motor de reglas contra datos frescos y persiste el
 * resultado. Si el modo global es LIVE, cada recomendación individual sigue
 * sujeta al guardrail — si se excede, esa recomendación puntual cae a modo
 * SHADOW en vez de fallar toda la operación (fail-safe, no fail-closed).
 */
export class GenerateRecommendation {
  constructor(
    private readonly dataSource: DataSource,
    private readonly recommendationRepo: RecommendationRepository,
    private readonly systemConfigRepo: SystemConfigRepository,
    private readonly rateLimiter: RateLimiter,
    private readonly productProfileRepo: ProductProfileRepository,
    private readonly maxLivePerHour: number,
  ) {}

  async execute(): Promise<Recommendation[]> {
    const [bestsellers, productProfiles, recentTargetRefs, modeValue] = await Promise.all([
      this.dataSource.getBestsellers(BESTSELLERS_LIMIT),
      this.productProfileRepo.findAll(),
      this.recommendationRepo.findRecentTargetRefs(RECENT_DEDUP_WINDOW_HOURS),
      this.systemConfigRepo.get(EXECUTION_MODE_KEY),
    ]);

    const currentMode: ExecutionMode = isValidExecutionMode(modeValue ?? "") ? (modeValue as ExecutionMode) : "SHADOW";

    const decisions = evaluateRecommendationRules({
      bestsellers,
      productProfiles,
      recentlyRecommendedProductIds: recentTargetRefs,
    });

    const results: Recommendation[] = [];

    for (const decision of decisions) {
      let mode: RecommendationMode = currentMode === "LIVE" ? "LIVE" : "SHADOW";

      if (mode === "LIVE") {
        const executedThisHour = await this.rateLimiter.count(LIVE_GUARDRAIL_KEY);
        if (!isWithinLiveModeGuardrail(executedThisHour, this.maxLivePerHour)) {
          mode = "SHADOW"; // guardrail excedido: fail-safe, no se bloquea la generación entera
        }
      }

      const recommendation = Recommendation.create({
        id: randomUUID(),
        targetRef: decision.targetRef,
        ruleTriggered: decision.ruleTriggered,
        reason: decision.reason,
        mode,
      });

      if (mode === "LIVE") {
        recommendation.markExecuted();
        await this.rateLimiter.recordAndCount(LIVE_GUARDRAIL_KEY, LIVE_GUARDRAIL_WINDOW_SECONDS);
      }

      await this.recommendationRepo.save(recommendation);
      results.push(recommendation);
    }

    return results;
  }
}
