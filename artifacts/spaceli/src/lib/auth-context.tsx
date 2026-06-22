import { createContext, useContext, useState, type ReactNode } from "react";
import { useGetMe } from "@workspace/api-client-react";

interface AuthUser {
  id: number;
  naam: string;
  navn: string;
  epost: string;
  rolle: string;
  bankidVerifisert?: boolean;
  emailVerifisert?: boolean;
  vippsNummer?: string | null;
  personnummer?: string | null;
  kontonummer?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setToken: () => {},
  logout: () => {},
  isLoading: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    () => localStorage.getItem("ledi_token")
  );

  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) localStorage.setItem("ledi_token", t);
    else localStorage.removeItem("ledi_token");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user, isLoading } = useGetMe({ query: { enabled: !!token, retry: false } as any });

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user: (user as AuthUser) ?? null, token, setToken, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
