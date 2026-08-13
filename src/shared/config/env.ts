import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4100),
  DATABASE_URL: z.string().url(),
  MONGODB_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  OPERATOR_EMAIL: z.string().email(),
  OPERATOR_PASSWORD_HASH: z.string().min(1),
  ORDERFLOW_BASE_URL: z.string().url(),
  AGGREGATION_CRON_SCHEDULE: z.string().default("*/10 * * * *"),
  LIVE_MODE_MAX_PER_HOUR: z.coerce.number().int().positive().default(20),
  // Whitelist explícita, separada por comas — mismo criterio que api-gateway
  // de OrderFlow. Vacío por defecto: sin el dominio de Vercel del dashboard
  // cargado todavía, ningún browser puede llamar cross-origin.
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas o faltantes en decision-engine:");
  console.error(parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;
