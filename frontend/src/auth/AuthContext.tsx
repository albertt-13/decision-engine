import { createContext, useContext, useState, type ReactNode } from "react";
import { getStoredToken, setStoredToken } from "../api/client.js";
import { login as loginRequest } from "../api/auth.js";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
