import { app } from "./app.js";
import { env } from "./shared/config/env.js";
import { logger } from "./shared/logger.js";
import { prisma } from "./adapters/outbound/postgres/prisma.js";
import { connectMongo, mongoClient } from "./adapters/outbound/mongo/mongo.js";
import { redis } from "./adapters/outbound/redis/redis.js";
import { startAggregationCron, stopAggregationCron } from "./adapters/inbound/cron/aggregationCron.js";
import { startInsightsCron, stopInsightsCron } from "./adapters/inbound/cron/insightsCron.js";

async function main() {
  await connectMongo();

  const server = app.listen(env.PORT, () => {
    logger.info(`decision-engine escuchando en http://localhost:${env.PORT}`);
  });

  startAggregationCron();
  startInsightsCron();

  process.on("SIGTERM", () => {
    logger.info("SIGTERM recibido: dejando de aceptar requests nuevas...");
    stopAggregationCron();
    stopInsightsCron();
    server.close(() => {
      logger.info("server HTTP cerrado, cerrando conexiones...");
      Promise.allSettled([prisma.$disconnect(), mongoClient.close(), redis.quit()]).then(() => {
        logger.info("listo, chau");
        process.exit(0);
      });
    });
  });
}

main().catch((err) => {
  logger.error({ err }, "decision-engine no pudo arrancar");
  process.exit(1);
});
