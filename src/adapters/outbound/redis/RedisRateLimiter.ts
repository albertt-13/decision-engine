import type { RateLimiter } from "../../../ports/RateLimiter.js";
import { redis } from "./redis.js";

/**
 * Ventana fija (INCR + EXPIRE), mismo patrón que `loginRateLimiter` de
 * OrderFlow — más simple que una ventana deslizante, con el trade-off ya
 * conocido de permitir un burst en el borde de la ventana. Aceptable para
 * un guardrail de "no más de N por hora", no para algo que necesite
 * precisión exacta.
 */
export class RedisRateLimiter implements RateLimiter {
  async recordAndCount(key: string, windowSeconds: number): Promise<number> {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return count;
  }

  async count(key: string): Promise<number> {
    const value = await redis.get(key);
    return value ? Number(value) : 0;
  }
}
