import type { AiTool } from "./AiTool.js";
import type { ListRecommendations } from "../ListRecommendations.js";
import type { GetSalesSnapshots } from "../GetSalesSnapshots.js";
import type { ListProductProfiles } from "../ListProductProfiles.js";

const EMPTY_OBJECT_SCHEMA = { type: "object", properties: {}, additionalProperties: false } as const;

export interface AiToolDeps {
  listRecommendations: ListRecommendations;
  getSalesSnapshots: GetSalesSnapshots;
  listProductProfiles: ListProductProfiles;
}

/**
 * Tools expuestas al LLM — cada una envuelve un caso de uso que ya existe
 * y devuelve un resumen agregado, nunca la colección cruda. Mismo criterio
 * que ya usa el motor de reglas: nada de "dame todo", siempre datos ya
 * reducidos a lo que hace falta para razonar.
 */
export function buildAiTools(deps: AiToolDeps): AiTool[] {
  return [
    {
      definition: {
        name: "get_recommendations_summary",
        description:
          "Resumen de las recomendaciones generadas por el motor de reglas: cantidad total, " +
          "desglose por modo (SHADOW/LIVE) y las 5 más recientes con su regla y motivo. " +
          "No devuelve la lista completa de recomendaciones.",
        inputSchema: EMPTY_OBJECT_SCHEMA,
      },
      async execute() {
        const recommendations = await deps.listRecommendations.execute();
        const byMode = recommendations.reduce<Record<string, number>>((acc, r) => {
          acc[r.mode] = (acc[r.mode] ?? 0) + 1;
          return acc;
        }, {});
        const recent = recommendations.slice(0, 5).map((r) => ({
          targetRef: r.targetRef,
          rule: r.ruleTriggered,
          reason: r.reason,
          mode: r.mode,
        }));
        return { totalRecommendations: recommendations.length, byMode, recent };
      },
    },
    {
      definition: {
        name: "get_sales_snapshots_summary",
        description:
          "Resumen de la serie histórica de ventas (bestsellers) recolectada por el pipeline de " +
          "agregación: unidades totales vendidas en los snapshots recientes y el top 5 de productos " +
          "por unidades. No devuelve la lista completa de snapshots.",
        inputSchema: EMPTY_OBJECT_SCHEMA,
      },
      async execute() {
        const snapshots = await deps.getSalesSnapshots.execute(50);
        const totalUnits = snapshots.reduce((sum, s) => sum + s.unitsSold, 0);
        const byProduct = new Map<string, number>();
        for (const snapshot of snapshots) {
          byProduct.set(snapshot.productName, (byProduct.get(snapshot.productName) ?? 0) + snapshot.unitsSold);
        }
        const topProducts = [...byProduct.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([productName, unitsSold]) => ({ productName, unitsSold }));
        return { snapshotCount: snapshots.length, totalUnits, topProducts };
      },
    },
    {
      definition: {
        name: "get_channel_performance_summary",
        description:
          "Resumen agregado de performance por canal de marketing: Google Ads, Meta Ads, GA4 y " +
          "Search Console (spend, clicks, conversiones, ROAS según corresponda) sumado sobre todo " +
          "el catálogo, más el top 3 de productos con mejor ROAS en Google Ads. Estas métricas son " +
          "simuladas (no hay integración real con esas plataformas), derivadas del mismo funnel " +
          "que las métricas de marketing del catálogo. No devuelve el detalle por producto.",
        inputSchema: EMPTY_OBJECT_SCHEMA,
      },
      async execute() {
        const profiles = await deps.listProductProfiles.execute();
        if (profiles.length === 0) {
          return { totalProducts: 0 };
        }

        const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
        const googleSpend = sum(profiles.map((p) => p.channels.googleAds.spend));
        const googleRevenue = sum(profiles.map((p) => p.channels.googleAds.conversions * Number(p.price)));

        const topByGoogleRoas = [...profiles]
          .sort((a, b) => b.channels.googleAds.roas - a.channels.googleAds.roas)
          .slice(0, 3)
          .map((p) => ({ sku: p.sku, name: p.name, roas: p.channels.googleAds.roas }));

        return {
          googleAds: {
            totalSpend: googleSpend,
            totalClicks: sum(profiles.map((p) => p.channels.googleAds.clicks)),
            totalConversions: sum(profiles.map((p) => p.channels.googleAds.conversions)),
            blendedRoas: googleSpend > 0 ? Math.round((googleRevenue / googleSpend) * 100) / 100 : 0,
          },
          metaAds: {
            totalSpend: sum(profiles.map((p) => p.channels.metaAds.spend)),
            totalClicks: sum(profiles.map((p) => p.channels.metaAds.clicks)),
            totalConversions: sum(profiles.map((p) => p.channels.metaAds.conversions)),
          },
          ga4: {
            totalOrganicSessions: sum(profiles.map((p) => p.channels.ga4.organicSessions)),
            totalPaidSessions: sum(profiles.map((p) => p.channels.ga4.paidSessions)),
            avgBounceRate: sum(profiles.map((p) => p.channels.ga4.bounceRate)) / profiles.length,
          },
          searchConsole: {
            totalSearchClicks: sum(profiles.map((p) => p.channels.searchConsole.searchClicks)),
            totalSearchImpressions: sum(profiles.map((p) => p.channels.searchConsole.searchImpressions)),
            avgPosition: sum(profiles.map((p) => p.channels.searchConsole.avgPosition)) / profiles.length,
          },
          topByGoogleAdsRoas: topByGoogleRoas,
        };
      },
    },
    {
      definition: {
        name: "get_catalog_summary",
        description:
          "Resumen del catálogo de productos: cantidad total, promedio de tasa de abandono de " +
          "carrito, y el top 5 de productos con mayor abandono (candidatos a recuperación). Las " +
          "métricas de marketing son simuladas (OrderFlow no trackea vistas/carrito real). No " +
          "devuelve el catálogo completo.",
        inputSchema: EMPTY_OBJECT_SCHEMA,
      },
      async execute() {
        const profiles = await deps.listProductProfiles.execute();
        const avgAbandonment =
          profiles.length === 0
            ? 0
            : profiles.reduce((sum, p) => sum + p.marketing.cartAbandonmentRate, 0) / profiles.length;
        const topAbandonment = [...profiles]
          .sort((a, b) => b.marketing.cartAbandonmentRate - a.marketing.cartAbandonmentRate)
          .slice(0, 5)
          .map((p) => ({
            sku: p.sku,
            name: p.name,
            category: p.category.name,
            cartAbandonmentRate: p.marketing.cartAbandonmentRate,
          }));
        return { totalProducts: profiles.length, avgCartAbandonmentRate: avgAbandonment, topAbandonment };
      },
    },
  ];
}
