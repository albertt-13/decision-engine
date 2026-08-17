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
  // Dos adapters de LLMClient (puerto único, ver ports/LLMClient.ts) — Anthropic es el elegido
  // para el diseño documentado, Groq es un segundo adapter real (no un mock) que prueba que el
  // puerto efectivamente permite cambiar de proveedor sin tocar dominio/aplicación, y de paso
  // permite probar todo el flujo sin gastar crédito pago.
  LLM_PROVIDER: z.enum(["anthropic", "groq"]).default("anthropic"),
  ANTHROPIC_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  AGGREGATION_CRON_SCHEDULE: z.string().default("*/10 * * * *"),
  INSIGHTS_CRON_SCHEDULE: z.string().default("0 6 * * *"),
  LIVE_MODE_MAX_PER_HOUR: z.coerce.number().int().positive().default(20),
  // Whitelist explícita, separada por comas — mismo criterio que api-gateway
  // de OrderFlow. Vacío por defecto: sin el dominio de Vercel del dashboard
  // cargado todavía, ningún browser puede llamar cross-origin.
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
}).superRefine((value, ctx) => {
  if (value.LLM_PROVIDER === "anthropic" && !value.ANTHROPIC_API_KEY) {
    ctx.addIssue({ code: "custom", path: ["ANTHROPIC_API_KEY"], message: "requerida cuando LLM_PROVIDER=anthropic" });
  }
  if (value.LLM_PROVIDER === "groq" && !value.GROQ_API_KEY) {
    ctx.addIssue({ code: "custom", path: ["GROQ_API_KEY"], message: "requerida cuando LLM_PROVIDER=groq" });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas o faltantes en decision-engine:");
  console.error(parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;
