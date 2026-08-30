import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import client from "../api/client";
import { AuthProvider } from "../auth/AuthContext";
import Account from "./Account";

function renderAccount() {
  render(
    <MemoryRouter initialEntries={["/account"]}>
      <AuthProvider>
        <Routes>
          <Route path="/account" element={<Account />} />
          <Route path="/login" element={<div>Login-Seite</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Account", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "officecloset_user",
      JSON.stringify({ id: "1", email: "test@example.com" })
    );
    window.localStorage.setItem("officecloset_token", "fake-token");
    vi.restoreAllMocks();
  });

  it("zeigt den angemeldeten Nutzer und die Löschoption", () => {
    renderAccount();

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account löschen" })).toBeInTheDocument();
  });

  it("löscht den Account nach Bestätigung und leitet zur Login-Seite weiter", async () => {
    const deleteSpy = vi.spyOn(client, "delete").mockResolvedValue({ ok: true, status: 204 });

    renderAccount();

    fireEvent.click(screen.getByRole("button", { name: "Account löschen" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Endgültig löschen" }));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith("/api/account");
    });

    await waitFor(() => {
      expect(screen.getByText("Login-Seite")).toBeInTheDocument();
    });

    expect(window.localStorage.getItem("officecloset_token")).toBeNull();
    expect(window.localStorage.getItem("officecloset_user")).toBeNull();
  });

  it("zeigt eine Fehlermeldung, wenn das Löschen fehlschlägt", async () => {
    vi.spyOn(client, "delete").mockResolvedValue({ ok: false, status: 500 });

    renderAccount();

    fireEvent.click(screen.getByRole("button", { name: "Account löschen" }));
    fireEvent.click(screen.getByRole("button", { name: "Endgültig löschen" }));

    await waitFor(() => {
      expect(
        screen.getByText("Der Account konnte nicht gelöscht werden.")
      ).toBeInTheDocument();
    });
  });
});
