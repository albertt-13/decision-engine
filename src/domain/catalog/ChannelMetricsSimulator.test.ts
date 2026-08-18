import { describe, expect, it } from "vitest";
import { simulateChannelMetrics } from "./ChannelMetricsSimulator.js";
import type { MarketingMetrics } from "./ProductProfile.js";

function fixedRandom(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
}

function buildMarketing(overrides: Partial<MarketingMetrics> = {}): MarketingMetrics {
  return {
    viewCount: 1000,
    addToCartCount: 300,
    purchaseCount: 100,
    cartAbandonmentRate: 0.67,
    conversionRate: 0.1,
    avgTimeInCartSeconds: 300,
    avgDecisionTimeSeconds: 60,
    peakPurchaseHour: 18,
    ...overrides,
  };
}

describe("simulateChannelMetrics", () => {
  it("ga4.organicSessions + ga4.paidSessions === marketing.viewCount", () => {
    const channels = simulateChannelMetrics({
      marketing: buildMarketing(),
      price: "1000",
      random: fixedRandom([0.5, 0.4, 0.3, 0.2, 0.6, 0.1, 0.7, 0.5, 0.4]),
    });
    expect(channels.ga4.organicSessions + channels.ga4.paidSessions).toBe(1000);
  });

  it("googleAds.clicks + metaAds.clicks === ga4.paidSessions", () => {
    const channels = simulateChannelMetrics({
      marketing: buildMarketing(),
      price: "1000",
      random: fixedRandom([0.5, 0.4, 0.3, 0.2, 0.6, 0.1, 0.7, 0.5, 0.4]),
    });
    expect(channels.googleAds.clicks + channels.metaAds.clicks).toBe(channels.ga4.paidSessions);
  });

  it("metaAds.reach nunca supera a metaAds.impressions", () => {
    const channels = simulateChannelMetrics({
      marketing: buildMarketing(),
      price: "1000",
      random: fixedRandom([0.9, 0.9, 0.9, 0.9, 0.9]),
    });
    expect(channels.metaAds.reach).toBeLessThanOrEqual(channels.metaAds.impressions);
  });

  it("googleAds.roas sale de conversiones × precio real / spend, no de un número aparte", () => {
    const channels = simulateChannelMetrics({
      marketing: buildMarketing(),
      price: "500",
      random: fixedRandom([0.5, 0.6, 0.05, 0.1, 0.3]),
    });
    const expected = channels.googleAds.spend > 0 ? (channels.googleAds.conversions * 500) / channels.googleAds.spend : 0;
    expect(channels.googleAds.roas).toBeCloseTo(Math.round(expected * 100) / 100, 2);
  });

  it("con viewCount=0 no explota (todo queda en 0, sin división por cero)", () => {
    const channels = simulateChannelMetrics({
      marketing: buildMarketing({ viewCount: 0, purchaseCount: 0 }),
      price: "1000",
      random: fixedRandom([0.5]),
    });
    expect(Number.isFinite(channels.googleAds.roas)).toBe(true);
    expect(channels.ga4.organicSessions + channels.ga4.paidSessions).toBe(0);
  });
});
