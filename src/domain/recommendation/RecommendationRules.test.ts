import { describe, expect, it } from "vitest";
import { evaluateRecommendationRules } from "./RecommendationRules.js";
import type { ProductProfile } from "../catalog/ProductProfile.js";

const bestsellers = [
  { id: "p1", name: "Producto 1", price: "10.00", unitsSold: 50 },
  { id: "p2", name: "Producto 2", price: "20.00", unitsSold: 40 },
  { id: "p3", name: "Producto 3", price: "30.00", unitsSold: 30 },
  { id: "p4", name: "Producto 4", price: "40.00", unitsSold: 20 },
];

function buildProfile(overrides: Partial<ProductProfile> & { orderFlowProductId: string }): ProductProfile {
  return {
    id: `profile-${overrides.orderFlowProductId}`,
    sku: "GEN-PRO-0001",
    name: "Producto genérico",
    price: "10.00",
    category: { code: "GEN", name: "General" },
    subcategory: { code: "PRO", name: "Producto" },
    marketing: {
      viewCount: 0,
      addToCartCount: 0,
      purchaseCount: 0,
      cartAbandonmentRate: 0,
      conversionRate: 0,
      avgTimeInCartSeconds: 0,
      avgDecisionTimeSeconds: 0,
      peakPurchaseHour: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("evaluateRecommendationRules — regla de bestsellers", () => {
  it("recomienda solo el top 3 de bestsellers", () => {
    const decisions = evaluateRecommendationRules({
      bestsellers,
      productProfiles: [],
      recentlyRecommendedProductIds: [],
    });

    expect(decisions).toHaveLength(3);
    expect(decisions.map((d) => d.targetRef)).toEqual(["p1", "p2", "p3"]);
  });

  it("excluye productos recomendados recientemente (dedup)", () => {
    const decisions = evaluateRecommendationRules({
      bestsellers,
      productProfiles: [],
      recentlyRecommendedProductIds: ["p1"],
    });

    expect(decisions.map((d) => d.targetRef)).toEqual(["p2", "p3"]);
  });

  it("cada decisión trae la regla disparada y una razón legible", () => {
    const [decision] = evaluateRecommendationRules({ bestsellers, productProfiles: [], recentlyRecommendedProductIds: [] });

    expect(decision?.ruleTriggered).toBe("top-3-bestseller-no-recomendado-recientemente");
    expect(decision?.reason).toContain("Producto 1");
    expect(decision?.reason).toContain("puesto #1");
  });

  it("no recomienda nada si no hay bestsellers ni perfiles", () => {
    const decisions = evaluateRecommendationRules({ bestsellers: [], productProfiles: [], recentlyRecommendedProductIds: [] });
    expect(decisions).toEqual([]);
  });
});

describe("evaluateRecommendationRules — regla de abandono de carrito", () => {
  it("recomienda productos con abandono >= 50% y vistas suficientes", () => {
    const profile = buildProfile({
      orderFlowProductId: "p5",
      name: "Silla Ergonómica",
      sku: "MOB-SIL-0001",
      marketing: {
        viewCount: 500,
        addToCartCount: 150,
        purchaseCount: 50,
        cartAbandonmentRate: 0.67,
        conversionRate: 0.1,
        avgTimeInCartSeconds: 300,
        avgDecisionTimeSeconds: 60,
        peakPurchaseHour: 14,
      },
    });

    const decisions = evaluateRecommendationRules({ bestsellers: [], productProfiles: [profile], recentlyRecommendedProductIds: [] });

    expect(decisions).toHaveLength(1);
    expect(decisions[0]?.targetRef).toBe("p5");
    expect(decisions[0]?.ruleTriggered).toBe("alto-abandono-carrito-recuperable");
    expect(decisions[0]?.reason).toContain("67%");
    expect(decisions[0]?.reason).toContain("MOB-SIL-0001");
  });

  it("ignora productos con abandono alto pero pocas vistas (ruido, no señal)", () => {
    const profile = buildProfile({
      orderFlowProductId: "p6",
      marketing: {
        viewCount: 5,
        addToCartCount: 2,
        purchaseCount: 0,
        cartAbandonmentRate: 1,
        conversionRate: 0,
        avgTimeInCartSeconds: 0,
        avgDecisionTimeSeconds: 0,
        peakPurchaseHour: 0,
      },
    });

    const decisions = evaluateRecommendationRules({ bestsellers: [], productProfiles: [profile], recentlyRecommendedProductIds: [] });
    expect(decisions).toEqual([]);
  });

  it("ignora productos con abandono bajo, aunque tengan muchas vistas", () => {
    const profile = buildProfile({
      orderFlowProductId: "p7",
      marketing: {
        viewCount: 1000,
        addToCartCount: 400,
        purchaseCount: 350,
        cartAbandonmentRate: 0.125,
        conversionRate: 0.35,
        avgTimeInCartSeconds: 100,
        avgDecisionTimeSeconds: 30,
        peakPurchaseHour: 10,
      },
    });

    const decisions = evaluateRecommendationRules({ bestsellers: [], productProfiles: [profile], recentlyRecommendedProductIds: [] });
    expect(decisions).toEqual([]);
  });

  it("un producto que matchea ambas reglas se recomienda una sola vez", () => {
    const profile = buildProfile({
      orderFlowProductId: "p1", // mismo id que el bestseller #1
      marketing: {
        viewCount: 500,
        addToCartCount: 200,
        purchaseCount: 50,
        cartAbandonmentRate: 0.75,
        conversionRate: 0.1,
        avgTimeInCartSeconds: 200,
        avgDecisionTimeSeconds: 40,
        peakPurchaseHour: 20,
      },
    });

    const decisions = evaluateRecommendationRules({ bestsellers, productProfiles: [profile], recentlyRecommendedProductIds: [] });
    const p1Decisions = decisions.filter((d) => d.targetRef === "p1");
    expect(p1Decisions).toHaveLength(1);
  });
});
