/**
 * Puerto genérico de conteo con ventana de tiempo — lo implementa Redis hoy,
 * pero el guardrail de dominio (`isWithinLiveModeGuardrail`) solo necesita
 * "cuántos eventos hubo en la ventana", no sabe que es Redis.
 */
export interface RateLimiter {
  /** Registra un evento y devuelve cuántos hubo en la ventana (incluyendo este). */
  recordAndCount(key: string, windowSeconds: number): Promise<number>;
  /** Solo consulta, sin registrar. */
  count(key: string): Promise<number>;
}
