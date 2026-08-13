import { apiClient } from "./client.js";

export async function login(email: string, password: string): Promise<string> {
  const { data } = await apiClient.post<{ accessToken: string }>("/auth/login", { email, password });
  return data.accessToken;
}
