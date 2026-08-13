import type { ProductProfile } from "../domain/catalog/ProductProfile.js";

export interface ProductProfileRepository {
  save(profile: ProductProfile): Promise<void>;
  findAll(): Promise<ProductProfile[]>;
  findByOrderFlowProductId(orderFlowProductId: string): Promise<ProductProfile | null>;
  /** Para calcular el próximo número de secuencia del SKU dentro de una subcategoría. */
  countBySubcategory(subcategoryCode: string): Promise<number>;
}
