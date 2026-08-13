export type ExecutionMode = "SHADOW" | "LIVE";

export interface Recommendation {
  id: string;
  targetRef: string;
  ruleTriggered: string;
  reason: string;
  mode: ExecutionMode;
  executedAt: string | null;
  createdAt: string;
}

export interface SalesSnapshot {
  id: string;
  productId: string;
  productName: string;
  unitsSold: number;
  capturedAt: string;
}

export interface CategoryRef {
  code: string;
  name: string;
}

export interface MarketingMetrics {
  viewCount: number;
  addToCartCount: number;
  purchaseCount: number;
  cartAbandonmentRate: number;
  conversionRate: number;
  avgTimeInCartSeconds: number;
  avgDecisionTimeSeconds: number;
  peakPurchaseHour: number;
}

export interface ProductProfile {
  id: string;
  sku: string;
  orderFlowProductId: string;
  name: string;
  price: string;
  category: CategoryRef;
  subcategory: CategoryRef;
  marketing: MarketingMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface SyncCatalogResult {
  created: number;
  skipped: number;
}
