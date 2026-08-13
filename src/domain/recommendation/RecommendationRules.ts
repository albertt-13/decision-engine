import type { Product } from "./Product.js";

export interface RuleInput {
  /** Bestsellers ordenados de más a menos vendido, tal como los devuelve el DataSource. */
  bestsellers: Product[];
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

/**
 * Motor de reglas v1: determinístico, sin ML — un `if`/`filter` legible es
 * un motor de decisión válido para probar el punto de "recomendaciones
 * auditables". Cada decisión guarda qué regla la disparó y por qué, así el
 * caso de uso puede persistirlo tal cual para auditoría.
 */
export function evaluateRecommendationRules(input: RuleInput): RuleDecision[] {
  const top = input.bestsellers.slice(0, TOP_N);

  return top
    .filter((product) => !input.recentlyRecommendedProductIds.includes(product.id))
    .map((product, index) => ({
      targetRef: product.id,
      ruleTriggered: RULE_TOP_BESTSELLER,
      reason:
        `"${product.name}" está en el puesto #${index + 1} de más vendidos` +
        (product.unitsSold !== undefined ? ` (${product.unitsSold} unidades)` : "") +
        " y no fue recomendado recientemente.",
    }));
}
