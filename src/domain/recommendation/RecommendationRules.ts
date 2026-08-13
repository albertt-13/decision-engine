import type { Product } from "./Product.js";
import type { ProductProfile } from "../catalog/ProductProfile.js";

export interface RuleInput {
  /** Bestsellers ordenados de más a menos vendido, tal como los devuelve el DataSource. */
  bestsellers: Product[];
  /** Perfiles enriquecidos (SKU, categoría, métricas de marketing) — ver domain/catalog. */
  productProfiles: ProductProfile[];
  /** productIds ya recomendados recientemente (dedup) — lo decide el caso de uso, no el motor. */
  recentlyRecommendedProductIds: string[];
}

export interface RuleDecision {
  targetRef: string;
  ruleTriggered: string;
  reason: string;
}

const TOP_N = 3;
const RULE_TOP_BESTSELLER = "top-3-bestseller-no-recomendado-recientemente";
const RULE_CART_ABANDONMENT = "alto-abandono-carrito-recuperable";
const ABANDONMENT_RATE_THRESHOLD = 0.5; // 50%+
const MIN_VIEWS_FOR_ABANDONMENT_RULE = 100; // evita recomendar por 2 vistas y 1 abandono

/**
 * Motor de reglas v1: determinístico, sin ML — un `if`/`filter` legible es
 * un motor de decisión válido para probar el punto de "recomendaciones
 * auditables". Cada decisión guarda qué regla la disparó y por qué, así el
 * caso de uso puede persistirlo tal cual para auditoría.
 *
 * Dos reglas independientes, combinadas y deduplicadas por producto (si un
 * producto matchea las dos, se recomienda una sola vez — la primera que lo
 * encuentra gana):
 * 1. Top-3 bestseller (datos reales de OrderFlow).
 * 2. Alto abandono de carrito (datos simulados de `ProductProfile` — "la
 *    empresa mejora ventas con técnicas de marketing" se traduce acá en
 *    "hay evidencia de interés que no se convirtió, vale la pena una
 *    campaña de recuperación").
 */
export function evaluateRecommendationRules(input: RuleInput): RuleDecision[] {
  const decisions = [
    ...evaluateBestsellerRule(input.bestsellers, input.recentlyRecommendedProductIds),
    ...evaluateCartAbandonmentRule(input.productProfiles, input.recentlyRecommendedProductIds),
  ];

  const seen = new Set<string>();
  return decisions.filter((decision) => {
    if (seen.has(decision.targetRef)) return false;
    seen.add(decision.targetRef);
    return true;
  });
}

function evaluateBestsellerRule(bestsellers: Product[], excluded: string[]): RuleDecision[] {
  const top = bestsellers.slice(0, TOP_N);

  return top
    .filter((product) => !excluded.includes(product.id))
    .map((product, index) => ({
      targetRef: product.id,
      ruleTriggered: RULE_TOP_BESTSELLER,
      reason:
        `"${product.name}" está en el puesto #${index + 1} de más vendidos` +
        (product.unitsSold !== undefined ? ` (${product.unitsSold} unidades)` : "") +
        " y no fue recomendado recientemente.",
    }));
}

function evaluateCartAbandonmentRule(profiles: ProductProfile[], excluded: string[]): RuleDecision[] {
  return profiles
    .filter((p) => p.marketing.viewCount >= MIN_VIEWS_FOR_ABANDONMENT_RULE)
    .filter((p) => p.marketing.cartAbandonmentRate >= ABANDONMENT_RATE_THRESHOLD)
    .filter((p) => !excluded.includes(p.orderFlowProductId))
    .sort((a, b) => b.marketing.cartAbandonmentRate - a.marketing.cartAbandonmentRate)
    .slice(0, TOP_N)
    .map((p) => ({
      targetRef: p.orderFlowProductId,
      ruleTriggered: RULE_CART_ABANDONMENT,
      reason:
        `"${p.name}" (${p.sku}) tiene ${Math.round(p.marketing.cartAbandonmentRate * 100)}% de abandono de ` +
        `carrito sobre ${p.marketing.viewCount} vistas — buena candidata para una campaña de recuperación.`,
    }));
}
