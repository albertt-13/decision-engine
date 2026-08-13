import type { MarketingMetrics } from "./ProductProfile.js";

/**
 * Genera métricas de funnel INTERNAMENTE CONSISTENTES (no 4 números al azar
 * sin relación entre sí): vistas -> % que agrega al carrito -> % de eso que
 * compra. `cartAbandonmentRate` y `conversionRate` se derivan de los conteos,
 * no se inventan aparte — así los datos se sostienen si alguien los cruza.
 *
 * `random` es inyectable (default `Math.random`) para poder testear el
 * cálculo con una fuente determinística, sin mockear nada de infraestructura.
 */
export function simulateMarketingMetrics(random: () => number = Math.random): MarketingMetrics {
  const viewCount = Math.round(50 + random() * 4950); // 50-5000
  const addToCartRate = 0.1 + random() * 0.3; // 10%-40% de las vistas agregan al carrito
  const addToCartCount = Math.round(viewCount * addToCartRate);
  const purchaseRate = 0.4 + random() * 0.45; // 40%-85% de lo que entra al carrito se compra
  const purchaseCount = Math.round(addToCartCount * purchaseRate);

  const cartAbandonmentRate = addToCartCount > 0 ? 1 - purchaseCount / addToCartCount : 0;
  const conversionRate = viewCount > 0 ? purchaseCount / viewCount : 0;

  return {
    viewCount,
    addToCartCount,
    purchaseCount,
    cartAbandonmentRate,
    conversionRate,
    avgTimeInCartSeconds: Math.round(45 + random() * 2355), // 45s - 40min
    avgDecisionTimeSeconds: Math.round(10 + random() * 590), // 10s - 10min
    peakPurchaseHour: Math.floor(random() * 24),
  };
}
