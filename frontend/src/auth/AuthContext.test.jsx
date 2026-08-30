import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import { client } from "../api/client";

function LoginProbe() {
  const { token, login } = useAuth();
  const [error, setError] = useState("");

  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          try {
            await login("neu@example.de", "sicheres-passwort");
          } catch (err) {
            setError(err?.message || "unbekannter Fehler");
          }
        }}
      >
        Einloggen
      </button>
      <span data-testid="session">{token ? "angemeldet" : "abgemeldet"}</span>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AuthContext", () => {
  it("persistiert das Token nach dem Login und sendet es bei einem Folge-Request als Bearer-Header mit", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: "persisted-token",
          token_type: "bearer",
          user: { id: 1, email: "neu@example.de" },
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, []));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Einloggen" }));

    await waitFor(() => {
      expect(screen.getByTestId("session")).toHaveTextContent("angemeldet");
    });
    expect(localStorage.getItem("officecloset_token")).toBe("persisted-token");
    expect(JSON.parse(localStorage.getItem("officecloset_user"))).toEqual({
      id: 1,
      email: "neu@example.de",
    });

    await client.get("/api/wardrobe/items");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const followUp = fetchMock.mock.calls[1];
    expect(followUp[0]).toBe("http://localhost:8000/api/wardrobe/items");
    expect(followUp[1].headers.get("Authorization")).toBe("Bearer persisted-token");
  });

  it("akzeptiert ein Token unter dem Feld 'token' als Fallback", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        token: "fallback-token",
        user: { id: 2, email: "fallback@example.de" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Einloggen" }));

    await waitFor(() => {
      expect(screen.getByTestId("session")).toHaveTextContent("angemeldet");
    });
    expect(localStorage.getItem("officecloset_token")).toBe("fallback-token");
  });

  it("wirft einen verständlichen Fehler, wenn die Antwort kein Token enthält", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { user: { id: 3, email: "x@example.de" } }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Einloggen" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Der Server hat kein Zugriffs-Token geliefert. Bitte versuche es erneut."
    );
    expect(screen.getByTestId("session")).toHaveTextContent("abgemeldet");
    expect(localStorage.getItem("officecloset_token")).toBeNull();
  });
});
