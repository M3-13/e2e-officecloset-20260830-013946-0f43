import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Wardrobe from "./Wardrobe";

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  };
}

function createFetchHandler(initialItems = []) {
  let items = [...initialItems];
  let nextId = Math.max(0, ...initialItems.map((i) => i.id)) + 1;

  return async function handler(url, options = {}) {
    const method = options.method || "GET";
    const path = url.replace("http://localhost:8000", "");

    if (method === "GET" && path.startsWith("/api/wardrobe/items")) {
      const category = new URL(url).searchParams.get("category");
      const filtered = category ? items.filter((i) => i.category === category) : items;
      return jsonResponse(200, filtered);
    }

    if (method === "POST" && path === "/api/wardrobe/items") {
      const formData = options.body;
      const item = {
        id: nextId++,
        name: formData.get("name"),
        category: formData.get("category"),
        image_url: formData.get("image") ? "/api/uploads/test.png" : null,
        created_at: new Date().toISOString(),
      };
      items.push(item);
      return jsonResponse(201, item);
    }

    const match = path.match(/^\/api\/wardrobe\/items\/(\d+)$/);
    if (match) {
      const id = Number(match[1]);

      if (method === "PATCH") {
        const idx = items.findIndex((i) => i.id === id);
        if (idx === -1) return jsonResponse(404, { detail: "nicht gefunden" });
        const body = JSON.parse(options.body);
        items[idx] = { ...items[idx], ...body };
        return jsonResponse(200, items[idx]);
      }

      if (method === "DELETE") {
        items = items.filter((i) => i.id !== id);
        return jsonResponse(204, null);
      }
    }

    return jsonResponse(404, { detail: "nicht gefunden" });
  };
}

describe("Wardrobe-Flow", () => {
  beforeEach(() => {
    localStorage.setItem("officecloset_token", "test-token");
    URL.createObjectURL = () => "blob:mock-preview";
    URL.revokeObjectURL = () => {};
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("legt ein Stück mit Bild an, filtert, bearbeitet und löscht es", async () => {
    const handler = createFetchHandler();
    vi.stubGlobal("fetch", vi.fn(handler));

    render(<Wardrobe />);

    expect(
      await screen.findByText("Deine Garderobe ist noch leer")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Erstes Stück hinzufügen" }));

    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Schwarzes Abendkleid" },
    });
    fireEvent.change(within(dialog).getByLabelText("Kategorie"), {
      target: { value: "kleid" },
    });

    const file = new File(["dummy"], "dress.png", { type: "image/png" });
    const imageInput = within(dialog).getByLabelText(/Bild auswählen/);
    Object.defineProperty(imageInput, "files", { value: [file], configurable: true });
    fireEvent.change(imageInput);

    fireEvent.submit(dialog.querySelector("form"));

    await waitFor(() => {
      expect(screen.getByText("Schwarzes Abendkleid")).toBeInTheDocument();
    });

    const filter = screen.getByRole("group", { name: "Kategorie-Filter" });
    fireEvent.click(within(filter).getByRole("button", { name: "Kleider" }));
    await waitFor(() => {
      expect(screen.getByText("Schwarzes Abendkleid")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Schwarzes Abendkleid bearbeiten" }));
    const editDialog = await screen.findByRole("dialog");
    const nameInput = within(editDialog).getByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "Rotes Abendkleid" } });
    fireEvent.submit(editDialog.querySelector("form"));

    await waitFor(() => {
      expect(screen.getByText("Rotes Abendkleid")).toBeInTheDocument();
    });

    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Rotes Abendkleid löschen" }));

    await waitFor(() => {
      expect(
        screen.getByText("Keine Stücke in dieser Kategorie")
      ).toBeInTheDocument();
    });
  });

  it("zeigt einen ansprechenden Leerzustand ohne Kleidungsstücke", async () => {
    const handler = createFetchHandler();
    vi.stubGlobal("fetch", vi.fn(handler));

    render(<Wardrobe />);

    expect(
      await screen.findByText("Deine Garderobe ist noch leer")
    ).toBeInTheDocument();
  });
});
