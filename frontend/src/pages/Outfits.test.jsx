import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Outfits from "./Outfits";
import client from "../api/client";

vi.mock("../api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  getBaseUrl: () => "http://localhost:8000",
}));

function json(data, status = 200) {
  return { ok: status < 400, status, json: async () => data };
}

const wardrobeItems = [
  { id: 1, name: "Schwarze Bluse", category: "oberteil", image_url: "/uploads/1.jpg", created_at: "2026-01-01" },
  { id: 2, name: "Goldene Kette", category: "accessoire", image_url: "", created_at: "2026-01-01" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

function mockLoad(outfits = []) {
  client.get.mockImplementation((path) => {
    if (path === "/api/outfits") return Promise.resolve(json(outfits));
    if (path === "/api/wardrobe/items") return Promise.resolve(json(wardrobeItems));
    return Promise.resolve(json([]));
  });
}

describe("Outfits", () => {
  it("stellt ein Outfit zusammen, speichert es und zeigt es in der Übersicht", async () => {
    mockLoad([]);
    const created = {
      id: 10,
      name: "Abendoutfit",
      items: [wardrobeItems[0]],
      created_at: "2026-01-01",
    };
    client.post.mockResolvedValue(json(created, 201));

    render(<Outfits />);

    await screen.findByText("Schwarze Bluse");

    fireEvent.click(screen.getByRole("button", { name: /Schwarze Bluse/ }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Abendoutfit" } });
    fireEvent.click(screen.getByRole("button", { name: "Outfit speichern" }));

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith("/api/outfits", {
        name: "Abendoutfit",
        item_ids: [1],
      });
    });

    expect(await screen.findByText("Abendoutfit")).toBeInTheDocument();
  });

  it("öffnet ein gespeichertes Outfit und löscht es", async () => {
    const outfit = { id: 10, name: "Abendoutfit", items: [wardrobeItems[0]], created_at: "2026-01-01" };
    mockLoad([outfit]);
    client.delete.mockResolvedValue({ ok: true, status: 204, json: async () => null });

    render(<Outfits />);

    fireEvent.click(await screen.findByRole("button", { name: "Öffnen" }));
    await screen.findByText("Outfit bearbeiten");

    fireEvent.click(screen.getByRole("button", { name: "Outfit löschen" }));

    await waitFor(() => {
      expect(client.delete).toHaveBeenCalledWith("/api/outfits/10");
    });

    await waitFor(() => {
      expect(screen.queryByText("Abendoutfit")).not.toBeInTheDocument();
    });
  });

  it("entfernt ein Stück aus einem geöffneten Outfit", async () => {
    const outfit = {
      id: 10,
      name: "Abendoutfit",
      items: [wardrobeItems[0], wardrobeItems[1]],
      created_at: "2026-01-01",
    };
    mockLoad([outfit]);
    const updated = { id: 10, name: "Abendoutfit", items: [wardrobeItems[0]], created_at: "2026-01-01" };
    client.delete.mockImplementation((path) => {
      if (path === "/api/outfits/10/items/2") return Promise.resolve(json(updated));
      return Promise.resolve({ ok: true, status: 204, json: async () => null });
    });

    render(<Outfits />);

    fireEvent.click(await screen.findByRole("button", { name: "Öffnen" }));
    await screen.findByText("Outfit bearbeiten");

    fireEvent.click(screen.getByRole("button", { name: "Goldene Kette entfernen" }));

    await waitFor(() => {
      expect(client.delete).toHaveBeenCalledWith("/api/outfits/10/items/2");
    });
  });
});
