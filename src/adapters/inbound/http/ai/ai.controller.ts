import { createHash } from "node:crypto";
import type { Request, Response } from "express";
import { useCases } from "../../../../composition.js";
import { redis } from "../../../outbound/redis/redis.js";
import type { AskAiInput } from "./ai.schemas.js";

const CACHE_TTL_SECONDS = 300;

/**
 * Cachea respuestas por pregunta normalizada — evita pagarle al LLM dos
 * veces la misma pregunta dentro de la ventana. Si Redis está degradado,
 * el endpoint sigue funcionando sin cache (mismo criterio "fail-safe" que
 * el guardrail de recomendaciones: Redis nunca puede tumbar la feature).
 */
export const aiController = {
  async ask(req: Request, res: Response) {
    const { question } = req.body as AskAiInput;
    const cacheKey = buildCacheKey(question);

    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
      res.status(200).json({ ...JSON.parse(cached), cached: true });
      return;
    }

    const result = await useCases.aiOrchestrator.ask(question);
    await redis.set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL_SECONDS).catch(() => undefined);
    res.status(200).json({ ...result, cached: false });
  },
};

function buildCacheKey(question: string): string {
  const normalized = question.trim().toLowerCase();
  return `ai:cache:${createHash("sha256").update(normalized).digest("hex")}`;
}
