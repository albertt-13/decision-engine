export type ExecutionMode = "SHADOW" | "LIVE";

export function isValidExecutionMode(value: string): value is ExecutionMode {
  return value === "SHADOW" || value === "LIVE";
}

/**
 * Guardrail como regla de dominio pura: dado cuántas recomendaciones ya se
 * ejecutaron en la última hora (el conteo real lo trae un adapter, ej.
 * Redis), decide si está permitido ejecutar una más. La política vive acá
 * para poder testearla sin infraestructura — el "de dónde sale el número"
 * es un detalle de adapter.
 */
export function isWithinLiveModeGuardrail(executedInLastHour: number, maxPerHour: number): boolean {
  return executedInLastHour < maxPerHour;
}
