export interface CategoryRef {
  code: string;
  name: string;
}

/**
 * Métricas de comportamiento de compra por producto. IMPORTANTE: son
 * SIMULADAS (ver `MarketingMetricsSimulator.ts`) — OrderFlow no trackea
 * vistas, carrito ni tiempos de decisión, solo pedidos confirmados. Esto
 * representa lo que un pipeline de analytics/CDP real produciría; acá se
 * genera sintéticamente para poder construir y probar el motor de reglas
 * que SÍ consume estos datos, sin depender de tener tráfico real.
 */
export interface MarketingMetrics {
  viewCount: number;
  addToCartCount: number;
  purchaseCount: number;
  /** 0-1. 1 - purchaseCount/addToCartCount */
  cartAbandonmentRate: number;
  /** 0-1. purchaseCount/viewCount */
  conversionRate: number;
  avgTimeInCartSeconds: number;
  avgDecisionTimeSeconds: number;
  /** 0-23 */
  peakPurchaseHour: number;
}

export interface ProductProfile {
  id: string;
  /** Nomenclatura CAT-SUB-#### — ver ProductCategorizer.ts */
  sku: string;
  orderFlowProductId: string;
  name: string;
  price: string;
  category: CategoryRef;
  subcategory: CategoryRef;
  marketing: MarketingMetrics;
  createdAt: Date;
  updatedAt: Date;
}
