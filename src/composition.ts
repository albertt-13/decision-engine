import { OrderFlowDataSource } from "./adapters/outbound/orderflow/OrderFlowDataSource.js";
import { PrismaRecommendationRepository } from "./adapters/outbound/postgres/PrismaRecommendationRepository.js";
import { PrismaSystemConfigRepository } from "./adapters/outbound/postgres/PrismaSystemConfigRepository.js";
import { MongoSalesSnapshotRepository } from "./adapters/outbound/mongo/MongoSalesSnapshotRepository.js";
import { RedisRateLimiter } from "./adapters/outbound/redis/RedisRateLimiter.js";
import { GenerateRecommendation } from "./application/GenerateRecommendation.js";
import { ToggleExecutionMode } from "./application/ToggleExecutionMode.js";
import { RunAggregationPipeline } from "./application/RunAggregationPipeline.js";
import { ListRecommendations } from "./application/ListRecommendations.js";
import { GetSalesSnapshots } from "./application/GetSalesSnapshots.js";
import { env } from "./shared/config/env.js";

/**
 * Composition root: el ÚNICO lugar del proyecto donde se conectan adapters
 * concretos (Prisma, Mongo, Redis, OrderFlow) a los casos de uso. Los
 * adapters inbound (HTTP, cron) importan `useCases` de acá, nunca instancian
 * un adapter outbound directamente — así el dominio y la aplicación no
 * saben qué implementación de cada puerto está corriendo.
 */
const dataSource = new OrderFlowDataSource();
const recommendationRepo = new PrismaRecommendationRepository();
const systemConfigRepo = new PrismaSystemConfigRepository();
const snapshotRepo = new MongoSalesSnapshotRepository();
const rateLimiter = new RedisRateLimiter();

export const useCases = {
  generateRecommendation: new GenerateRecommendation(
    dataSource,
    recommendationRepo,
    systemConfigRepo,
    rateLimiter,
    env.LIVE_MODE_MAX_PER_HOUR,
  ),
  toggleExecutionMode: new ToggleExecutionMode(systemConfigRepo),
  runAggregationPipeline: new RunAggregationPipeline(dataSource, snapshotRepo),
  listRecommendations: new ListRecommendations(recommendationRepo),
  getSalesSnapshots: new GetSalesSnapshots(snapshotRepo),
};
