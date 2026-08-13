import { describe, expect, it } from "vitest";
import { evaluateRecommendationRules } from "./RecommendationRules.js";

describe("evaluateRecommendationRules", () => {
  const bestsellers = [
    { id: "p1", name: "Producto 1", price: "10.00", unitsSold: 50 },
    { id: "p2", name: "Producto 2", price: "20.00", unitsSold: 40 },
    { id: "p3", name: "Producto 3", price: "30.00", unitsSold: 30 },
    { id: "p4", name: "Producto 4", price: "40.00", unitsSold: 20 },
  ];

  it("recomienda solo el top 3 de bestsellers", () => {
    const decisions = evaluateRecommendationRules({ bestsellers, recentlyRecommendedProductIds: [] });

    expect(decisions).toHaveLength(3);
    expect(decisions.map((d) => d.targetRef)).toEqual(["p1", "p2", "p3"]);
  });

  it("excluye productos recomendados recientemente (dedup)", () => {
    const decisions = evaluateRecommendationRules({
      bestsellers,
      recentlyRecommendedProductIds: ["p1"],
    });

    expect(decisions.map((d) => d.targetRef)).toEqual(["p2", "p3"]);
  });

  it("cada decisión trae la regla disparada y una razón legible", () => {
    const [decision] = evaluateRecommendationRules({ bestsellers, recentlyRecommendedProductIds: [] });

    expect(decision?.ruleTriggered).toBe("top-3-bestseller-no-recomendado-recientemente");
    expect(decision?.reason).toContain("Producto 1");
    expect(decision?.reason).toContain("puesto #1");
  });

  it("no recomienda nada si no hay bestsellers", () => {
    const decisions = evaluateRecommendationRules({ bestsellers: [], recentlyRecommendedProductIds: [] });
    expect(decisions).toEqual([]);
  });
});
