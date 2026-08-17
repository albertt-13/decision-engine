import { apiClient } from "./client.js";
import type { AskAiResult, Insight } from "./types.js";

export async function askAi(question: string): Promise<AskAiResult> {
  const { data } = await apiClient.post<AskAiResult>("/ai/ask", { question });
  return data;
}

export async function listInsights(): Promise<Insight[]> {
  const { data } = await apiClient.get<Insight[]>("/insights");
  return data;
}
