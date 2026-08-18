import { describe, expect, it } from "vitest";
import { buildAiTools } from "./aiTools.js";
import { ListRecommendations } from "../ListRecommendations.js";
import { GetSalesSnapshots } from "../GetSalesSnapshots.js";
import { ListProductProfiles } from "../ListProductProfiles.js";
import { Recommendation } from "../../domain/recommendation/Recommendation.js";
import type { RecommendationRepository } from "../../ports/RecommendationRepository.js";
import type { SalesSnapshotRepository } from "../../ports/SalesSnapshotRepository.js";
import type { ProductProfileRepository } from "../../ports/ProductProfileRepository.js";
import type { SalesSnapshot } from "../../domain/reporting/SalesSnapshot.js";
import type { ProductProfile } from "../../domain/catalog/ProductProfile.js";

function notImplemented(): never {
  throw new Error("not implemented in fake");
}

function buildTools() {
  const recommendations = [
    Recommendation.fromPersisted({
      id: "r1",
      targetRef: "p1",
      ruleTriggered: "top-3-bestseller-no-recomendado-recientemente",
      reason: "bestseller",
      mode: "LIVE",
      executedAt: new Date(),
      createdAt: new Date(),
    }),
    Recommendation.fromPersisted({
      id: "r2",
      targetRef: "p2",
      ruleTriggered: "alto-abandono-carrito-recuperable",
      reason: "abandono alto",
      mode: "SHADOW",
      executedAt: null,
      createdAt: new Date(),
    }),
  ];

  const recommendationRepo: RecommendationRepository = {
    save: notImplemented,
    findById: notImplemented,
    findRecentTargetRefs: notImplemented,
    list: async () => recommendations,
  };

  const snapshots: SalesSnapshot[] = [
    { id: "s1", productId: "p1", productName: "Auriculares X", unitsSold: 10, capturedAt: new Date() },
    { id: "s2", productId: "p1", productName: "Auriculares X", unitsSold: 5, capturedAt: new Date() },
    { id: "s3", productId: "p2", productName: "Mouse Y", unitsSold: 3, capturedAt: new Date() },
  ];

  const snapshotRepo: SalesSnapshotRepository = {
    saveMany: notImplemented,
    listRecent: async () => snapshots,
  };

  const profiles: ProductProfile[] = [
    {
      id: "prof-1",
      sku: "AUD-AUR-0001",
      orderFlowProductId: "p1",
      name: "Auriculares X",
      price: "1000",
      category: { code: "AUD", name: "Audio" },
      subcategory: { code: "AUR", name: "Auriculares" },
      marketing: {
        viewCount: 200,
        addToCartCount: 100,
        purchaseCount: 20,
        cartAbandonmentRate: 0.8,
        conversionRate: 0.1,
        avgTimeInCartSeconds: 120,
        avgDecisionTimeSeconds: 60,
        peakPurchaseHour: 18,
      },
      channels: {
        googleAds: { impressions: 4000, clicks: 200, ctr: 0.05, cpc: 100, spend: 20000, conversions: 8, roas: 4 },
        ga4: { organicSessions: 100, paidSessions: 100, bounceRate: 0.4, avgSessionDurationSeconds: 90 },
        searchConsole: { searchImpressions: 3000, searchClicks: 80, avgPosition: 5.5 },
        metaAds: { reach: 1500, impressions: 2000, clicks: 60, ctr: 0.03, spend: 6000, conversions: 3 },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const productProfileRepo: ProductProfileRepository = {
    save: notImplemented,
    findAll: async () => profiles,
    findByOrderFlowProductId: notImplemented,
    countBySubcategory: notImplemented,
  };

  return buildAiTools({
    listRecommendations: new ListRecommendations(recommendationRepo),
    getSalesSnapshots: new GetSalesSnapshots(snapshotRepo),
    listProductProfiles: new ListProductProfiles(productProfileRepo),
  });
}

describe("aiTools", () => {
  it("get_recommendations_summary agrega por modo, no devuelve la lista cruda", async () => {
    const tools = buildTools();
    const tool = tools.find((t) => t.definition.name === "get_recommendations_summary")!;

    const result = (await tool.execute({})) as { totalRecommendations: number; byMode: Record<string, number> };

    expect(result.totalRecommendations).toBe(2);
    expect(result.byMode).toEqual({ LIVE: 1, SHADOW: 1 });
  });

  it("get_sales_snapshots_summary suma unidades por producto", async () => {
    const tools = buildTools();
    const tool = tools.find((t) => t.definition.name === "get_sales_snapshots_summary")!;

    const result = (await tool.execute({})) as { totalUnits: number; topProducts: { productName: string; unitsSold: number }[] };

    expect(result.totalUnits).toBe(18);
    expect(result.topProducts[0]).toEqual({ productName: "Auriculares X", unitsSold: 15 });
  });

  it("get_catalog_summary calcula el promedio de abandono de carrito", async () => {
    const tools = buildTools();
    const tool = tools.find((t) => t.definition.name === "get_catalog_summary")!;

    const result = (await tool.execute({})) as { totalProducts: number; avgCartAbandonmentRate: number };

    expect(result.totalProducts).toBe(1);
    expect(result.avgCartAbandonmentRate).toBe(0.8);
  });

  it("get_channel_performance_summary agrega spend y conversiones por canal, no expone el detalle crudo", async () => {
    const tools = buildTools();
    const tool = tools.find((t) => t.definition.name === "get_channel_performance_summary")!;

    const result = (await tool.execute({})) as {
      googleAds: { totalSpend: number; totalConversions: number; blendedRoas: number };
      metaAds: { totalSpend: number };
      topByGoogleAdsRoas: { sku: string }[];
    };

    expect(result.googleAds.totalSpend).toBe(20000);
    expect(result.googleAds.totalConversions).toBe(8);
    expect(result.googleAds.blendedRoas).toBe(0.4); // 8 conversiones * $1000 / $20000 spend
    expect(result.metaAds.totalSpend).toBe(6000);
    expect(result.topByGoogleAdsRoas[0]?.sku).toBe("AUD-AUR-0001");
  });
});
