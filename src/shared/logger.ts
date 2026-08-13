import pino from "pino";
import { env } from "./config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  base: { service: "decision-engine" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.refreshToken",
      "*.accessToken",
    ],
    censor: "[REDACTED]",
  },
  ...(env.NODE_ENV === "production" ? {} : { transport: { target: "pino-pretty", options: { colorize: true } } }),
});
