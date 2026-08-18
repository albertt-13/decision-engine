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

/**
 * Métricas por canal de marketing — SIMULADAS, mismo motivo y mismo criterio
 * que `MarketingMetrics` (ver `ChannelMetricsSimulator.ts`): no hay
 * integración real con Google Ads / GA4 / Search Console / Meta Ads, pero sí
 * el shape de datos que esas APIs devolverían, derivado del mismo funnel
 * simulado (`MarketingMetrics`) para que los números se sostengan si alguien
 * los cruza entre sí. Shopify no se simula: ya está cubierto por los datos
 * reales de OrderFlow (`orderFlowProductId`, `price`, ventas).
 */
export interface GoogleAdsMetrics {
  impressions: number;
  clicks: number;
  ctr: number; // 0-1, clicks/impressions
  cpc: number; // costo por click, misma moneda que `price`
  spend: number;
  conversions: number;
  roas: number; // ingreso atribuido / spend
}

export interface Ga4Metrics {
  organicSessions: number;
  paidSessions: number;
  bounceRate: number; // 0-1
  avgSessionDurationSeconds: number;
}

export interface SearchConsoleMetrics {
  searchImpressions: number;
  searchClicks: number;
  avgPosition: number; // 1-100, más bajo es mejor
}

export interface MetaAdsMetrics {
  reach: number;
  impressions: number;
  clicks: number;
  ctr: number; // 0-1
  spend: number;
  conversions: number;
}

export interface ChannelMetrics {
  googleAds: GoogleAdsMetrics;
  ga4: Ga4Metrics;
  searchConsole: SearchConsoleMetrics;
  metaAds: MetaAdsMetrics;
}

export interface ProductProfile {
  id: string;
  /** Nomenclatura CAT-SUB-#### — ver ProductCategorizer.ts */
  sku: string;
  orderFlowProductId: string;
  /**
   * "OrderFlow" para el catálogo real. Cualquier otro valor es una marca
   * 100% simulada (catálogo + marketing + canales) sembrada para mostrar
   * variedad — ver `demoBrands.ts` y `SeedSimulatedBrand.ts`. No es
   * multi-tenancy real: no hay aislamiento de datos ni auth por marca,
   * es una dimensión de agrupación en el mismo catálogo single-tenant.
   */
  brand: string;
  name: string;
  price: string;
  category: CategoryRef;
  subcategory: CategoryRef;
  marketing: MarketingMetrics;
  channels: ChannelMetrics;
  createdAt: Date;
  updatedAt: Date;
}
