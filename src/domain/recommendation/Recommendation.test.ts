import { describe, expect, it } from "vitest";
import { Recommendation } from "./Recommendation.js";

function buildRecommendation(mode: "SHADOW" | "LIVE") {
  return Recommendation.create({
    id: "rec-1",
    targetRef: "p1",
    ruleTriggered: "top-3-bestseller-no-recomendado-recientemente",
    reason: "porque sí",
    mode,
  });
}

describe("Recommendation", () => {
  it("nace sin ejecutar", () => {
    const rec = buildRecommendation("SHADOW");
    expect(rec.executedAt).toBeNull();
  });

  it("markExecuted funciona en modo LIVE", () => {
    const rec = buildRecommendation("LIVE");
    rec.markExecuted();
    expect(rec.executedAt).toBeInstanceOf(Date);
  });

  it("markExecuted falla en modo SHADOW — es justamente lo que shadow mode garantiza", () => {
    const rec = buildRecommendation("SHADOW");
    expect(() => rec.markExecuted()).toThrow(/LIVE/);
  });

  it("markExecuted no se puede llamar dos veces", () => {
    const rec = buildRecommendation("LIVE");
    rec.markExecuted();
    expect(() => rec.markExecuted()).toThrow(/ya fue ejecutada/);
  });
});
