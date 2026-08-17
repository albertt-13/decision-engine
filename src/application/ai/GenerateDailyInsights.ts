import { randomUUID } from "node:crypto";
import type { InsightRepository } from "../../ports/InsightRepository.js";
import type { AiOrchestrator } from "./AiOrchestrator.js";

const GENERATED_BY = "claude-sonnet-5";

const PROMPT = [
  "Basándote en los datos agregados disponibles (recomendaciones, ventas, catálogo), generá entre",
  "2 y 3 insights de negocio concretos y accionables, en español. Un insight por línea, cada línea",
  "empezando con '- '. No agregues texto antes ni después de la lista, ni numeración.",
].join(" ");

/**
 * Le pide al AI Analyst que lea los datos agregados y resuma 2-3 insights
 * de negocio, y los persiste en Postgres — mismo motivo que `Recommendation`
 * vive en Postgres: son decisiones/salidas del sistema que necesitan
 * integridad y auditoría (quién/qué las generó, cuándo), no un log de
 * eventos.
 */
export class GenerateDailyInsights {
  constructor(
    private readonly orchestrator: AiOrchestrator,
    private readonly insightRepo: InsightRepository,
  ) {}

  async execute(): Promise<number> {
    const { answer } = await this.orchestrator.ask(PROMPT);
    const lines = answer
      .split("\n")
      .map((line) => line.replace(/^-\s*/, "").trim())
      .filter(Boolean);

    for (const content of lines) {
      await this.insightRepo.save({ id: randomUUID(), content, generatedBy: GENERATED_BY, createdAt: new Date() });
    }

    return lines.length;
  }
}
