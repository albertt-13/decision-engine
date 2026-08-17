import cron from "node-cron";
import { useCases } from "../../../composition.js";
import { env } from "../../../shared/config/env.js";
import { logger } from "../../../shared/logger.js";

let task: ReturnType<typeof cron.schedule> | null = null;

/**
 * Insight Engine: corre después del pipeline de agregación (mismo proceso,
 * cron separado con su propio horario — no hace falta que corran juntos).
 * Le pide al AI Analyst 2-3 insights sobre los datos ya agregados y los
 * persiste. Por defecto una vez al día — no tiene sentido gastar llamadas
 * al LLM más seguido que la frecuencia con la que cambian los datos reales.
 */
export function startInsightsCron(): void {
  task = cron.schedule(env.INSIGHTS_CRON_SCHEDULE, () => {
    void runOnce();
  });
  logger.info({ schedule: env.INSIGHTS_CRON_SCHEDULE }, "insight engine programado");
}

export function stopInsightsCron(): void {
  task?.stop();
}

async function runOnce(): Promise<void> {
  try {
    const count = await useCases.generateDailyInsights.execute();
    logger.info({ count }, "insight engine: insights generados");
  } catch (err) {
    logger.warn({ err }, "insight engine falló esta corrida (se reintenta en la próxima)");
  }
}
