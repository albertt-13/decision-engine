import type { Product } from "../domain/recommendation/Product.js";

/**
 * Puerto que el dominio define para pedir datos de "afuera" — hoy lo
 * implementa `OrderFlowDataSource`, pegándole a la API pública de OrderFlow.
 * El motor de reglas y el pipeline de agregación solo conocen esta interfaz:
 * cambiar de fuente de datos el día de mañana es escribir un adapter nuevo.
 */
export interface DataSource {
  getBestsellers(limit: number): Promise<Product[]>;
  getCatalog(query?: { name?: string }): Promise<Product[]>;
}
