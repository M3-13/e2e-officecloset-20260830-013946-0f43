import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getToken, setToken } from "../api/client";

const USER_KEY = "officecloset_user";

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => readStoredUser());

  const persistUser = useCallback((value) => {
    setUserState(value);
    try {
      if (value) {
        window.localStorage.setItem(USER_KEY, JSON.stringify(value));
      } else {
        window.localStorage.removeItem(USER_KEY);
      }
    } catch {
      // storage may be unavailable; user state stays in memory only.
    }
  }, []);

  const login = useCallback(async (_email, _password) => {
    // Platzhalter: die echte Anmeldung wird mit dem Login-Ticket ergänzt.
    throw new Error("Die Anmeldung ist noch nicht verfügbar.");
  }, []);

  const register = useCallback(async (_email, _password) => {
    // Platzhalter: die echte Registrierung wird mit dem Register-Ticket ergänzt.
    throw new Error("Die Registrierung ist noch nicht verfügbar.");
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setTokenState(null);
    persistUser(null);
  }, [persistUser]);

  const value = useMemo(
    () => ({ user, token, login, logout, register }),
    [user, token, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth muss innerhalb eines AuthProvider verwendet werden");
  }
  return ctx;
}

export default AuthContext;
