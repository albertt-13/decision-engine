import { useState, type ReactNode } from "react";
import { getStoredToken, setStoredToken } from "../api/client.js";
import { login as loginRequest } from "../api/auth.js";
import { AuthContext } from "./context.js";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getStoredToken() !== null);

  async function login(email: string, password: string) {
    const token = await loginRequest(email, password);
    setStoredToken(token);
    setIsAuthenticated(true);
  }

  function logout() {
    setStoredToken(null);
    setIsAuthenticated(false);
  }

  return <AuthContext.Provider value={{ isAuthenticated, login, logout }}>{children}</AuthContext.Provider>;
}
