import cron from "node-cron";
import { useCases } from "../../../composition.js";
import { env } from "../../../shared/config/env.js";
import { logger } from "../../../shared/logger.js";

let task: ReturnType<typeof cron.schedule> | null = null;

export function startAggregationCron(): void {
  task = cron.schedule(env.AGGREGATION_CRON_SCHEDULE, () => {
    void runOnce();
  });
  logger.info({ schedule: env.AGGREGATION_CRON_SCHEDULE }, "pipeline de agregación programado");
}

export function stopAggregationCron(): void {
  task?.stop();
}

async function runOnce(): Promise<void> {
  try {
    const count = await useCases.runAggregationPipeline.execute();
    logger.info({ count }, "pipeline de agregación: snapshot guardado");
  } catch (err) {
    logger.warn({ err }, "pipeline de agregación falló esta corrida (se reintenta en la próxima)");
  }
}
