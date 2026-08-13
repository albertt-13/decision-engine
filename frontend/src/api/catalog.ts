import { apiClient } from "./client.js";
import type { ProductProfile, SyncCatalogResult } from "./types.js";

export async function listCatalog(): Promise<ProductProfile[]> {
  const { data } = await apiClient.get<ProductProfile[]>("/catalog");
  return data;
}

export async function syncCatalog(): Promise<SyncCatalogResult> {
  const { data } = await apiClient.post<SyncCatalogResult>("/catalog/sync");
  return data;
}
