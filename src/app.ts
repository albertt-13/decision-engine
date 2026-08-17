import { randomUUID } from "node:crypto";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { logger } from "./shared/logger.js";
import { env } from "./shared/config/env.js";
import { metricsMiddleware, metricsHandler } from "./shared/metrics.js";
import { runHealthChecks } from "./shared/health.js";
import { prisma } from "./adapters/outbound/postgres/prisma.js";
import { redis } from "./adapters/outbound/redis/redis.js";
import { pingMongo } from "./adapters/outbound/mongo/mongo.js";
import { errorHandler } from "./adapters/inbound/http/middleware/errorHandler.js";
import { authRouter } from "./adapters/inbound/http/auth/auth.routes.js";
import { recommendationsRouter } from "./adapters/inbound/http/recommendations/recommendations.routes.js";
import { reportsRouter } from "./adapters/inbound/http/reports/reports.routes.js";
import { catalogRouter } from "./adapters/inbound/http/catalog/catalog.routes.js";
import { aiRouter } from "./adapters/inbound/http/ai/ai.routes.js";
import { insightsRouter } from "./adapters/inbound/http/insights/insights.routes.js";

export const app = express();

app.use((req, res, next) => {
  const existing = req.headers["x-request-id"];
  const id = typeof existing === "string" && existing.length > 0 ? existing : randomUUID();
  req.headers["x-request-id"] = id;
  res.setHeader("x-request-id", id);
  next();
});
app.use(pinoHttp({ logger, genReqId: (req) => (req.headers["x-request-id"] as string) || randomUUID() }));
app.use(metricsMiddleware);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false }));
app.use(express.json());

app.get("/metrics", metricsHandler);

// Liveness: sin dependencias externas. Lección aprendida en OrderFlow (ver
// su bitácora): un health check agregado NUNCA debe ser lo que la
// plataforma usa para decidir si reinicia el proceso.
app.get("/live", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/health", async (_req, res) => {
  const { status, dependencies } = await runHealthChecks({
    postgres: () => prisma.$queryRaw`SELECT 1`,
    redis: () => redis.ping(),
    mongodb: () => pingMongo(),
  });
  res.status(status === "ok" ? 200 : 503).json({ status, service: "decision-engine", dependencies });
});

app.use("/auth", authRouter);
app.use("/recommendations", recommendationsRouter);
app.use("/reports", reportsRouter);
app.use("/catalog", catalogRouter);
app.use("/ai", aiRouter);
app.use("/insights", insightsRouter);

app.use(errorHandler);
