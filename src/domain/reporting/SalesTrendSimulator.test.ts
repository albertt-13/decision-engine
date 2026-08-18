import { describe, expect, it } from "vitest";
import { simulateHistoricalTrend } from "./SalesTrendSimulator.js";

function fixedRandom(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
}

describe("simulateHistoricalTrend", () => {
  it("genera un punto por día pedido", () => {
    const snapshots = simulateHistoricalTrend({
      productId: "p1",
      productName: "Producto 1",
      currentUnitsSold: 500,
      days: 30,
      random: fixedRandom([0.5, 0.3, 0.7, 0.2]),
    });
    expect(snapshots).toHaveLength(30);
  });

  it("es monótonamente creciente (unitsSold es un contador acumulado, nunca baja)", () => {
    const snapshots = simulateHistoricalTrend({
      productId: "p1",
      productName: "Producto 1",
      currentUnitsSold: 500,
      days: 30,
      random: fixedRandom([0.9, 0.1, 0.6, 0.3, 0.8]),
    });
    for (let i = 1; i < snapshots.length; i++) {
      expect(snapshots[i]!.unitsSold).toBeGreaterThanOrEqual(snapshots[i - 1]!.unitsSold);
    }
  });

  it("nunca supera currentUnitsSold (el valor real de hoy)", () => {
    const snapshots = simulateHistoricalTrend({
      productId: "p1",
      productName: "Producto 1",
      currentUnitsSold: 500,
      days: 30,
      random: fixedRandom([0.99]),
    });
    for (const snapshot of snapshots) {
      expect(snapshot.unitsSold).toBeLessThanOrEqual(500);
    }
  });

  it("todos los puntos quedan marcados como simulados", () => {
    const snapshots = simulateHistoricalTrend({
      productId: "p1",
      productName: "Producto 1",
      currentUnitsSold: 100,
      days: 10,
      random: fixedRandom([0.5]),
    });
    expect(snapshots.every((s) => s.source === "simulated")).toBe(true);
  });

  it("con currentUnitsSold=0 no explota (todo queda en 0)", () => {
    const snapshots = simulateHistoricalTrend({
      productId: "p1",
      productName: "Producto 1",
      currentUnitsSold: 0,
      days: 10,
      random: fixedRandom([0.5]),
    });
    expect(snapshots.every((s) => s.unitsSold === 0)).toBe(true);
  });
});
