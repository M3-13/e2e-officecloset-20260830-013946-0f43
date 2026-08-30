import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { client, getToken, setToken } from "../api/client";

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

async function readErrorDetail(response) {
  try {
    const data = await response.json();
    if (data && typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    // Body ist kein JSON oder nicht lesbar; wir fallen auf die Statusmeldung zurück.
  }
  return null;
}

function friendlyAuthError(status, detail, kind) {
  switch (status) {
    case 401:
      return "E-Mail oder Passwort ist falsch.";
    case 409:
      return "Diese E-Mail-Adresse ist bereits registriert.";
    case 429:
      return "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.";
    default:
      if (detail) {
        return detail;
      }
      return kind === "login"
        ? "Die Anmeldung ist fehlgeschlagen. Bitte versuche es erneut."
        : "Die Registrierung ist fehlgeschlagen. Bitte versuche es erneut.";
  }
}

async function authenticate(kind, email, password) {
  const path = kind === "login" ? "/api/auth/login" : "/api/auth/register";
  const response = await client.post(path, { email, password });

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(friendlyAuthError(response.status, detail, kind));
  }

  const data = await response.json();
  return { token: data.access_token, user: data.user };
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

  const login = useCallback(
    async (email, password) => {
      const { token: accessToken, user: loggedInUser } = await authenticate(
        "login",
        email,
        password
      );
      setToken(accessToken);
      setTokenState(accessToken);
      persistUser(loggedInUser);
      return loggedInUser;
    },
    [persistUser]
  );

  const register = useCallback(
    async (email, password) => {
      const { token: accessToken, user: registeredUser } = await authenticate(
        "register",
        email,
        password
      );
      setToken(accessToken);
      setTokenState(accessToken);
      persistUser(registeredUser);
      return registeredUser;
    },
    [persistUser]
  );

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
