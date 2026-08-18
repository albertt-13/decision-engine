import type { SalesSnapshot } from "./SalesSnapshot.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Genera historial de respaldo para un producto REAL (`productId`/`productName`
 * vienen de OrderFlow) cuando el pipeline recién empezó a correr y no hay
 * suficientes corridas todavía para que la tendencia se vea con profundidad.
 * No es un número al azar por día: es una curva monótonamente creciente que
 * TERMINA en `currentUnitsSold` (el valor real de hoy) — `unitsSold` es un
 * contador acumulado, así que nunca puede bajar día a día. Se marca
 * `source: "simulated"` explícitamente, nunca se mezcla sin distinción con
 * los snapshots reales del pipeline.
 */
export function simulateHistoricalTrend(params: {
  productId: string;
  productName: string;
  currentUnitsSold: number;
  days: number;
  random?: () => number;
}): Array<Omit<SalesSnapshot, "id">> {
  const random = params.random ?? Math.random;
  const { productId, productName, currentUnitsSold, days } = params;

  const growthShare = 0.3 + random() * 0.4; // 30%-70% de las unidades se "vendieron" durante la ventana simulada
  const totalGrowth = Math.round(currentUnitsSold * growthShare);
  let cumulative = Math.max(currentUnitsSold - totalGrowth, 0);

  const snapshots: Array<Omit<SalesSnapshot, "id">> = [];
  const now = Date.now();

  for (let dayOffset = days; dayOffset >= 1; dayOffset--) {
    const remainingGrowth = Math.max(currentUnitsSold - cumulative, 0);
    const increment = Math.round((remainingGrowth / dayOffset) * (0.4 + random() * 1.2));
    cumulative = Math.min(cumulative + increment, currentUnitsSold);

    snapshots.push({
      productId,
      productName,
      unitsSold: cumulative,
      capturedAt: new Date(now - dayOffset * DAY_MS),
      source: "simulated",
    });
  }

  return snapshots;
}
