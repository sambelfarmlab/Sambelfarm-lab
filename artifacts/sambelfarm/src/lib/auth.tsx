import { createContext, useContext, useEffect, useState } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { fetchRemoteConfig } from "./config";

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("sf_auth_token");
  });

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("sf_auth_token"));
  }, []);

  // Pull server-side secrets (e.g. NOTION_DATABASE_ID) into localStorage
  // whenever we have a valid token — on initial load and after login.
  useEffect(() => {
    if (token) {
      fetchRemoteConfig(token);
    }
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("sf_auth_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("sf_auth_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
