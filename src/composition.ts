import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { OrderFlowDataSource } from "./adapters/outbound/orderflow/OrderFlowDataSource.js";
import { PrismaRecommendationRepository } from "./adapters/outbound/postgres/PrismaRecommendationRepository.js";
import { PrismaSystemConfigRepository } from "./adapters/outbound/postgres/PrismaSystemConfigRepository.js";
import { PrismaInsightRepository } from "./adapters/outbound/postgres/PrismaInsightRepository.js";
import { MongoSalesSnapshotRepository } from "./adapters/outbound/mongo/MongoSalesSnapshotRepository.js";
import { MongoProductProfileRepository } from "./adapters/outbound/mongo/MongoProductProfileRepository.js";
import { RedisRateLimiter } from "./adapters/outbound/redis/RedisRateLimiter.js";
import { AnthropicLLMClient } from "./adapters/outbound/anthropic/AnthropicLLMClient.js";
import { GenerateRecommendation } from "./application/GenerateRecommendation.js";
import { ToggleExecutionMode } from "./application/ToggleExecutionMode.js";
import { RunAggregationPipeline } from "./application/RunAggregationPipeline.js";
import { ListRecommendations } from "./application/ListRecommendations.js";
import { GetSalesSnapshots } from "./application/GetSalesSnapshots.js";
import { SyncProductCatalog } from "./application/SyncProductCatalog.js";
import { ListProductProfiles } from "./application/ListProductProfiles.js";
import { ListInsights } from "./application/ListInsights.js";
import { buildAiTools } from "./application/ai/aiTools.js";
import { AiOrchestrator } from "./application/ai/AiOrchestrator.js";
import { GenerateDailyInsights } from "./application/ai/GenerateDailyInsights.js";
import { env } from "./shared/config/env.js";

const businessContext = readFileSync(
  fileURLToPath(new URL("../docs/business-context.md", import.meta.url)),
  "utf-8",
);

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
const productProfileRepo = new MongoProductProfileRepository();
const rateLimiter = new RedisRateLimiter();
const insightRepo = new PrismaInsightRepository();
const llmClient = new AnthropicLLMClient();

const listRecommendations = new ListRecommendations(recommendationRepo);
const getSalesSnapshots = new GetSalesSnapshots(snapshotRepo);
const listProductProfiles = new ListProductProfiles(productProfileRepo);
const aiTools = buildAiTools({ listRecommendations, getSalesSnapshots, listProductProfiles });
const aiOrchestrator = new AiOrchestrator(llmClient, aiTools, businessContext);

export const useCases = {
  generateRecommendation: new GenerateRecommendation(
    dataSource,
    recommendationRepo,
    systemConfigRepo,
    rateLimiter,
    productProfileRepo,
    env.LIVE_MODE_MAX_PER_HOUR,
  ),
  toggleExecutionMode: new ToggleExecutionMode(systemConfigRepo),
  runAggregationPipeline: new RunAggregationPipeline(dataSource, snapshotRepo),
  listRecommendations,
  getSalesSnapshots,
  syncProductCatalog: new SyncProductCatalog(dataSource, productProfileRepo),
  listProductProfiles,
  aiOrchestrator,
  generateDailyInsights: new GenerateDailyInsights(aiOrchestrator, insightRepo),
  listInsights: new ListInsights(insightRepo),
};
