import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import Login from "./Login";
import Register from "./Register";

function renderAuth(initialPath) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<div>Garderobe-Ziel</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

function stubFetch(status, body) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Login", () => {
  it("rendert das Anmeldeformular", () => {
    renderAuth("/login");

    expect(screen.getByRole("heading", { name: "Anmelden" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-Mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Passwort")).toBeInTheDocument();
  });

  it("zeigt eine verständliche Fehlermeldung bei falschen Zugangsdaten", async () => {
    stubFetch(401, { detail: "Invalid credentials" });
    renderAuth("/login");

    fireEvent.change(screen.getByLabelText("E-Mail"), {
      target: { value: "nutzer@example.de" },
    });
    fireEvent.change(screen.getByLabelText("Passwort"), {
      target: { value: "falsches-passwort" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Anmelden" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("E-Mail oder Passwort ist falsch.");
  });

  it("meldet an, speichert das Token und navigiert zur Garderobe", async () => {
    stubFetch(200, {
      access_token: "test-token",
      token_type: "bearer",
      user: { id: 1, email: "nutzer@example.de" },
    });
    renderAuth("/login");

    fireEvent.change(screen.getByLabelText("E-Mail"), {
      target: { value: "nutzer@example.de" },
    });
    fireEvent.change(screen.getByLabelText("Passwort"), {
      target: { value: "geheim123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Anmelden" }));

    await waitFor(() => {
      expect(screen.getByText("Garderobe-Ziel")).toBeInTheDocument();
    });
    expect(window.localStorage.getItem("officecloset_token")).toBe("test-token");
    expect(JSON.parse(window.localStorage.getItem("officecloset_user"))).toEqual({
      id: 1,
      email: "nutzer@example.de",
    });
  });

  it("validiert Pflichtfelder, bevor es absendet", async () => {
    const fetchMock = stubFetch(200, {});
    renderAuth("/login");

    fireEvent.submit(screen.getByRole("button", { name: "Anmelden" }));

    expect(await screen.findByText("Bitte gib deine E-Mail-Adresse ein.")).toBeInTheDocument();
    expect(screen.getByText("Bitte gib dein Passwort ein.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("Register", () => {
  it("registriert, speichert das Token und navigiert zur Garderobe", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(201, {
        access_token: "reg-token",
        token_type: "bearer",
        user: { id: 2, email: "neu@example.de" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    renderAuth("/register");

    fireEvent.change(screen.getByLabelText("E-Mail"), {
      target: { value: "neu@example.de" },
    });
    fireEvent.change(screen.getByLabelText("Passwort"), {
      target: { value: "sicheres-passwort" },
    });
    fireEvent.change(screen.getByLabelText("Passwort wiederholen"), {
      target: { value: "sicheres-passwort" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Registrieren" }));

    await waitFor(() => {
      expect(screen.getByText("Garderobe-Ziel")).toBeInTheDocument();
    });
    expect(window.localStorage.getItem("officecloset_token")).toBe("reg-token");
  });

  it("zeigt eine verständliche Fehlermeldung bei bereits vergebener E-Mail", async () => {
    stubFetch(409, { detail: "Email already registered" });
    renderAuth("/register");

    fireEvent.change(screen.getByLabelText("E-Mail"), {
      target: { value: "vergeben@example.de" },
    });
    fireEvent.change(screen.getByLabelText("Passwort"), {
      target: { value: "sicheres-passwort" },
    });
    fireEvent.change(screen.getByLabelText("Passwort wiederholen"), {
      target: { value: "sicheres-passwort" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Registrieren" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Diese E-Mail-Adresse ist bereits registriert.");
  });

  it("validiert Passwortlänge und -übereinstimmung", async () => {
    const fetchMock = stubFetch(201, {});
    renderAuth("/register");

    fireEvent.change(screen.getByLabelText("E-Mail"), {
      target: { value: "neu@example.de" },
    });
    fireEvent.change(screen.getByLabelText("Passwort"), {
      target: { value: "kurz" },
    });
    fireEvent.change(screen.getByLabelText("Passwort wiederholen"), {
      target: { value: "anders" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Registrieren" }));

    expect(
      await screen.findByText("Das Passwort muss mindestens 8 Zeichen lang sein.")
    ).toBeInTheDocument();
    expect(screen.getByText("Die Passwörter stimmen nicht überein.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
