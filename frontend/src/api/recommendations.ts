import { apiClient } from "./client.js";
import type { ExecutionMode, Recommendation, SalesSnapshot } from "./types.js";

export async function generateRecommendations(): Promise<Recommendation[]> {
  const { data } = await apiClient.post<Recommendation[]>("/recommendations");
  return data;
}

export async function listRecommendations(mode?: ExecutionMode): Promise<Recommendation[]> {
  const { data } = await apiClient.get<Recommendation[]>("/recommendations", {
    params: mode ? { mode } : undefined,
  });
  return data;
}

export async function getExecutionMode(): Promise<ExecutionMode> {
  const { data } = await apiClient.get<{ mode: ExecutionMode }>("/recommendations/config");
  return data.mode;
}

export async function setExecutionMode(mode: ExecutionMode): Promise<ExecutionMode> {
  const { data } = await apiClient.patch<{ mode: ExecutionMode }>("/recommendations/config", { mode });
  return data.mode;
}

export async function getSalesSnapshots(): Promise<SalesSnapshot[]> {
  const { data } = await apiClient.get<SalesSnapshot[]>("/reports/sales-snapshots");
  return data;
}
