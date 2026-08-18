import { randomUUID } from "node:crypto";
import type { DataSource } from "../ports/DataSource.js";
import type { ProductProfileRepository } from "../ports/ProductProfileRepository.js";
import type { ProductProfile } from "../domain/catalog/ProductProfile.js";
import { categorizeProduct, buildSku } from "../domain/catalog/ProductCategorizer.js";
import { simulateMarketingMetrics } from "../domain/catalog/MarketingMetricsSimulator.js";
import { simulateChannelMetrics } from "../domain/catalog/ChannelMetricsSimulator.js";

/**
 * Trae el catálogo completo de OrderFlow y crea un `ProductProfile` para
 * cada producto que todavía no tiene uno — categoría, SKU y métricas de
 * marketing simuladas (documentado como tal, ver `ProductProfile.ts`).
 * Idempotente: correrlo de nuevo solo agrega los productos nuevos, no
 * duplica ni pisa los perfiles existentes (para no perder métricas ya
 * "generadas" y mostradas en el dashboard).
 */
export class SyncProductCatalog {
  constructor(
    private readonly dataSource: DataSource,
    private readonly profileRepo: ProductProfileRepository,
    private readonly random: () => number = Math.random,
  ) {}

  async execute(): Promise<{ created: number; skipped: number }> {
    const catalog = await this.dataSource.getCatalog();
    let created = 0;
    let skipped = 0;

    for (const product of catalog) {
      const existing = await this.profileRepo.findByOrderFlowProductId(product.id);
      if (existing) {
        skipped++;
        continue;
      }

      const { category, subcategory } = categorizeProduct(product.name);
      const sequence = (await this.profileRepo.countBySubcategory(subcategory.code)) + 1;
      const now = new Date();
      const marketing = simulateMarketingMetrics(this.random);

      const profile: ProductProfile = {
        id: randomUUID(),
        sku: buildSku(category, subcategory, sequence),
        orderFlowProductId: product.id,
        name: product.name,
        price: product.price,
        category,
        subcategory,
        marketing,
        channels: simulateChannelMetrics({ marketing, price: product.price, random: this.random }),
        createdAt: now,
        updatedAt: now,
      };

      await this.profileRepo.save(profile);
      created++;
    }

    return { created, skipped };
  }
}
