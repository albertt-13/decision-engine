import type { DataSource } from "../../../ports/DataSource.js";
import type { Product } from "../../../domain/recommendation/Product.js";
import { env } from "../../../shared/config/env.js";

const TIMEOUT_MS = 8000;

interface OrderFlowProduct {
  id: string;
  name: string;
  price: string;
  stock: number;
}

interface OrderFlowBestseller extends OrderFlowProduct {
  sold: number;
}

interface OrderFlowProductsListResponse {
  items: OrderFlowProduct[];
}

/**
 * Único adapter de `DataSource` hoy: le pega a la API PÚBLICA de OrderFlow
 * (https://orderflow-api-gateway-....onrender.com) como lo haría cualquier
 * cliente externo — mismo trato que el frontend React tendría. No hay
 * credenciales especiales ni red compartida: si mañana OrderFlow cambia de
 * URL o se reemplaza por otra fuente de datos, esto es lo único que cambia.
 */
export class OrderFlowDataSource implements DataSource {
  async getBestsellers(limit: number): Promise<Product[]> {
    const data = await this.fetchJson<OrderFlowBestseller[]>(`/products/bestsellers?limit=${limit}`);
    return data.map((p) => ({ id: p.id, name: p.name, price: p.price, unitsSold: p.sold }));
  }

  async getCatalog(query?: { name?: string }): Promise<Product[]> {
    const qs = query?.name ? `?name=${encodeURIComponent(query.name)}` : "";
    const data = await this.fetchJson<OrderFlowProductsListResponse>(`/products${qs}`);
    return data.items.map((p) => ({ id: p.id, name: p.name, price: p.price }));
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${env.ORDERFLOW_BASE_URL}${path}`, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`OrderFlow respondió ${response.status} en ${path}`);
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
