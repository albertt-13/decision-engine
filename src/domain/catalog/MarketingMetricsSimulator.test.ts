import { describe, expect, it } from "vitest";
import { simulateMarketingMetrics } from "./MarketingMetricsSimulator.js";

/** Generador determinístico para no depender de Math.random en los tests. */
function fixedRandom(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
}

describe("simulateMarketingMetrics", () => {
  it("los conteos son internamente consistentes: addToCart <= views, purchase <= addToCart", () => {
    const metrics = simulateMarketingMetrics(fixedRandom([0.5, 0.3, 0.7]));
    expect(metrics.addToCartCount).toBeLessThanOrEqual(metrics.viewCount);
    expect(metrics.purchaseCount).toBeLessThanOrEqual(metrics.addToCartCount);
  });

  it("cartAbandonmentRate se deriva de los conteos, no es independiente", () => {
    const metrics = simulateMarketingMetrics(fixedRandom([0.5, 0.2, 0.5]));
    const expected = 1 - metrics.purchaseCount / metrics.addToCartCount;
    expect(metrics.cartAbandonmentRate).toBeCloseTo(expected, 10);
  });

  it("conversionRate se deriva de purchaseCount/viewCount", () => {
    const metrics = simulateMarketingMetrics(fixedRandom([0.5, 0.2, 0.5]));
    const expected = metrics.purchaseCount / metrics.viewCount;
    expect(metrics.conversionRate).toBeCloseTo(expected, 10);
  });

  it("peakPurchaseHour siempre cae en 0-23", () => {
    const metrics = simulateMarketingMetrics(fixedRandom([0.99]));
    expect(metrics.peakPurchaseHour).toBeGreaterThanOrEqual(0);
    expect(metrics.peakPurchaseHour).toBeLessThanOrEqual(23);
  });

  it("con random()=0 no explota (división por cero evitada)", () => {
    const metrics = simulateMarketingMetrics(fixedRandom([0]));
    expect(Number.isFinite(metrics.cartAbandonmentRate)).toBe(true);
    expect(Number.isFinite(metrics.conversionRate)).toBe(true);
  });
});
