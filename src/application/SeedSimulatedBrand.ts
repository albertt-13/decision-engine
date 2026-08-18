import { randomUUID } from "node:crypto";
import type { ProductProfileRepository } from "../ports/ProductProfileRepository.js";
import type { ProductProfile } from "../domain/catalog/ProductProfile.js";
import { buildSku } from "../domain/catalog/ProductCategorizer.js";
import { simulateMarketingMetrics } from "../domain/catalog/MarketingMetricsSimulator.js";
import { simulateChannelMetrics } from "../domain/catalog/ChannelMetricsSimulator.js";
import { DEMO_BRANDS } from "./demoBrands.js";

/**
 * Siembra los catálogos de las marcas demo (`demoBrands.ts`) — 100%
 * simulados, sin ningún dato real de OrderFlow. Mismo patrón que
 * `SyncProductCatalog` (idempotente vía `orderFlowProductId`, mismos
 * simuladores de marketing/canales) pero para productos que no existen en
 * ningún sistema externo: el "id externo" es sintético (`sim-{brand}-{n}`),
 * prefijo que los distingue a simple vista de un id real de OrderFlow (uuid).
 *
 * IMPORTANTE: esto NO es multi-tenancy. Es una dimensión `brand` más en el
 * mismo catálogo single-tenant, sin aislamiento de datos ni auth por marca
 * — eso quedó fuera del alcance a propósito (ver vault, nota de la
 * mutación).
 */
export class SeedSimulatedBrand {
  constructor(
    private readonly profileRepo: ProductProfileRepository,
    private readonly random: () => number = Math.random,
  ) {}

  async execute(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const brand of DEMO_BRANDS) {
      for (let i = 0; i < brand.products.length; i++) {
        const product = brand.products[i]!;
        const syntheticId = `sim-${brand.slug}-${i + 1}`;

        const existing = await this.profileRepo.findByOrderFlowProductId(syntheticId);
        if (existing) {
          skipped++;
          continue;
        }

        const sequence = (await this.profileRepo.countBySubcategory(product.subcategory.code)) + 1;
        const now = new Date();
        const marketing = simulateMarketingMetrics(this.random);

        const profile: ProductProfile = {
          id: randomUUID(),
          sku: buildSku(product.category, product.subcategory, sequence),
          orderFlowProductId: syntheticId,
          brand: brand.name,
          name: product.name,
          price: product.price,
          category: product.category,
          subcategory: product.subcategory,
          marketing,
          channels: simulateChannelMetrics({ marketing, price: product.price, random: this.random }),
          createdAt: now,
          updatedAt: now,
        };

        await this.profileRepo.save(profile);
        created++;
      }
    }

    return { created, skipped };
  }
}
