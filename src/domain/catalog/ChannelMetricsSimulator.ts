import type { ChannelMetrics, MarketingMetrics } from "./ProductProfile.js";

/**
 * Simula el shape de datos que Google Ads, GA4, Search Console y Meta Ads
 * devolverían por producto — SIN pegarle a ninguna API real (ver
 * `ProductProfile.ts` para el porqué). No son 4 generadores random
 * independientes: todo se deriva de `marketing` (el mismo funnel ya
 * simulado por `simulateMarketingMetrics`), así los números se sostienen si
 * alguien los cruza — ej.: `ga4.organicSessions + ga4.paidSessions ===
 * marketing.viewCount`, `metaAds.reach <= metaAds.impressions`, el ROAS de
 * Google Ads sale de conversiones × precio real / spend, no de un número
 * inventado aparte.
 *
 * Shopify no se simula acá: ya está cubierto por los datos reales de
 * OrderFlow (`price`, `orderFlowProductId`).
 */
export function simulateChannelMetrics(params: {
  marketing: MarketingMetrics;
  price: string;
  random?: () => number;
}): ChannelMetrics {
  const random = params.random ?? Math.random;
  const price = Number(params.price) || 0;
  const { viewCount, purchaseCount } = params.marketing;

  const paidShare = 0.3 + random() * 0.4; // 30%-70% del tráfico es pago
  const paidSessions = Math.round(viewCount * paidShare);
  const organicSessions = viewCount - paidSessions;

  const googleShare = 0.5 + random() * 0.3; // 50%-80% del tráfico pago es Google Ads, el resto Meta
  const googleClicks = Math.round(paidSessions * googleShare);
  const metaClicks = Math.max(paidSessions - googleClicks, 0);

  // CPC como % del precio del producto (no un monto absoluto fijo) — un CPC
  // fijo de, digamos, $200 arruina el ROAS de un producto de $30 y lo
  // infla en uno de $2000, sin relación real con el negocio.
  const googleCtr = 0.02 + random() * 0.08; // 2%-10%
  const googleCpc = clamp(price * (0.01 + random() * 0.06), 0.05, 50); // 1%-7% del precio
  const googleSpend = Math.round(googleClicks * googleCpc);
  const googleConversions = Math.round(purchaseCount * safeShare(googleClicks, viewCount));
  const googleRoas = googleSpend > 0 ? round2((googleConversions * price) / googleSpend) : 0;

  const metaCtr = 0.01 + random() * 0.06; // 1%-7%
  const metaCpc = clamp(price * (0.005 + random() * 0.035), 0.03, 30); // 0.5%-4% del precio
  const metaSpend = Math.round(metaClicks * metaCpc);
  const metaConversions = Math.round(purchaseCount * safeShare(metaClicks, viewCount));
  const metaImpressions = metaClicks > 0 ? Math.round(metaClicks / metaCtr) : Math.round(50 + random() * 500);

  const searchClicks = Math.round(organicSessions * (0.7 + random() * 0.25));
  const searchCtr = 0.01 + random() * 0.09; // 1%-10%

  return {
    googleAds: {
      impressions: googleClicks > 0 ? Math.round(googleClicks / googleCtr) : Math.round(100 + random() * 1000),
      clicks: googleClicks,
      ctr: googleCtr,
      cpc: round2(googleCpc),
      spend: googleSpend,
      conversions: googleConversions,
      roas: googleRoas,
    },
    ga4: {
      organicSessions,
      paidSessions,
      bounceRate: 0.25 + random() * 0.45, // 25%-70%
      avgSessionDurationSeconds: Math.round(20 + random() * 280),
    },
    searchConsole: {
      searchImpressions: searchClicks > 0 ? Math.round(searchClicks / searchCtr) : Math.round(100 + random() * 800),
      searchClicks,
      avgPosition: round2(1 + random() * 29), // 1-30
    },
    metaAds: {
      reach: Math.round(metaImpressions * (0.5 + random() * 0.35)), // reach <= impressions siempre
      impressions: metaImpressions,
      clicks: metaClicks,
      ctr: metaCtr,
      spend: metaSpend,
      conversions: metaConversions,
    },
  };
}

function safeShare(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(part / total, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
