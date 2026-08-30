import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import CategoryFilter from "../components/CategoryFilter";
import ItemCard from "../components/ItemCard";
import ItemForm from "../components/ItemForm";

async function readError(response, fallback) {
  try {
    const body = await response.json();
    if (body && typeof body.detail === "string") return body.detail;
  } catch {
    // ignore parse errors
  }
  return fallback;
}

export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchItems = useCallback(async (selectedCategory) => {
    setLoading(true);
    setLoadError("");
    try {
      const response = selectedCategory
        ? await client.get(
            `/api/wardrobe/items?category=${encodeURIComponent(selectedCategory)}`
          )
        : await client.get("/api/wardrobe/items");
      if (response.status === 401) {
        setLoadError("Bitte melde dich an, um deine Garderobe zu sehen.");
        setItems([]);
        return;
      }
      if (!response.ok) {
        setLoadError(await readError(response, "Die Garderobe konnte nicht geladen werden."));
        setItems([]);
        return;
      }
      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(
        err && err.message ? err.message : "Die Garderobe konnte nicht geladen werden."
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(category);
  }, [fetchItems, category]);

  function openCreate() {
    setEditing(null);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setFormError("");
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setFormError("");
  }

  async function handleCreate({ name, category: itemCategory, image }) {
    setSubmitting(true);
    setFormError("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", itemCategory);
      if (image) {
        formData.append("image", image);
      }
      const response = await client.post("/api/wardrobe/items", formData);
      if (!response.ok) {
        setFormError(await readError(response, "Das Kleidungsstück konnte nicht angelegt werden."));
        return;
      }
      closeForm();
      await fetchItems(category);
    } catch (err) {
      setFormError(
        err && err.message ? err.message : "Das Kleidungsstück konnte nicht angelegt werden."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate({ name, category: itemCategory }) {
    if (!editing) return;
    setSubmitting(true);
    setFormError("");
    try {
      const response = await client.patch(`/api/wardrobe/items/${editing.id}`, {
        name,
        category: itemCategory,
      });
      if (!response.ok) {
        setFormError(await readError(response, "Das Kleidungsstück konnte nicht bearbeitet werden."));
        return;
      }
      closeForm();
      await fetchItems(category);
    } catch (err) {
      setFormError(
        err && err.message ? err.message : "Das Kleidungsstück konnte nicht bearbeitet werden."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Möchtest du „${item.name}" wirklich löschen?`
    );
    if (!confirmed) return;
    try {
      const response = await client.delete(`/api/wardrobe/items/${item.id}`);
      if (!response.ok && response.status !== 204) {
        setLoadError(await readError(response, "Das Kleidungsstück konnte nicht gelöscht werden."));
        return;
      }
      await fetchItems(category);
    } catch (err) {
      setLoadError(
        err && err.message ? err.message : "Das Kleidungsstück konnte nicht gelöscht werden."
      );
    }
  }

  function handleSubmit(values) {
    if (editing) {
      handleUpdate(values);
    } else {
      handleCreate(values);
    }
  }

  const hasItems = items.length > 0;

  return (
    <section className="page">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight">Meine Garderobe</h1>
          <p className="mt-1 text-[15px] text-muted">
            {hasItems
              ? `${items.length} Kleidungsstück${items.length === 1 ? "" : "e"}`
              : "Deine persönliche Sammlung"}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="min-h-12 rounded-md bg-accent px-6 py-3 font-semibold tracking-[0.02em] text-bg transition-all duration-200 hover:-translate-y-px hover:bg-[#e2c25c] hover:shadow-[0_6px_16px_rgba(212,175,55,0.25)] active:translate-y-0 active:bg-[#b8942e] sm:w-auto"
        >
          + Stück hinzufügen
        </button>
      </div>

      <div className="mb-6">
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      {loading ? (
        <p className="text-muted">Lade Garderobe …</p>
      ) : loadError ? (
        <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
          <span aria-hidden="true" className="block text-5xl text-muted">
            !
          </span>
          <h2 className="mt-4 text-lg font-semibold text-fg">Etwas ist schiefgelaufen</h2>
          <p className="mx-auto mt-1 max-w-[420px] text-[15px] text-muted">{loadError}</p>
        </div>
      ) : !hasItems ? (
        category ? (
          <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
            <span aria-hidden="true" className="block text-5xl text-muted">
              ◇
            </span>
            <h2 className="mt-4 text-lg font-semibold text-fg">
              Keine Stücke in dieser Kategorie
            </h2>
            <p className="mx-auto mt-1 max-w-[420px] text-[15px] text-muted">
              Für diese Kategorie hast du noch nichts gespeichert.
            </p>
            <button
              type="button"
              onClick={() => setCategory(null)}
              className="mt-5 min-h-12 rounded-md border border-line bg-transparent px-6 py-3 text-fg transition-colors duration-200 hover:border-muted hover:bg-[#1b1712]"
            >
              Alle anzeigen
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
            <span aria-hidden="true" className="block text-5xl text-muted">
              ✦
            </span>
            <h2 className="mt-4 text-lg font-semibold text-fg">
              Deine Garderobe ist noch leer
            </h2>
            <p className="mx-auto mt-1 max-w-[420px] text-[15px] text-muted">
              Lege dein erstes Kleidungsstück an und baue dir deine eigene
              Red-Carpet-Kollektion auf.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 min-h-12 rounded-md bg-accent px-6 py-3 font-semibold tracking-[0.02em] text-bg transition-all duration-200 hover:-translate-y-px hover:bg-[#e2c25c] hover:shadow-[0_6px_16px_rgba(212,175,55,0.25)] active:translate-y-0 active:bg-[#b8942e]"
            >
              Erstes Stück hinzufügen
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
      )}

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,8,6,0.7)] p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={editing ? "Kleidungsstück bearbeiten" : "Kleidungsstück anlegen"}
        >
          <div className="relative max-w-[480px] rounded-lg border border-line bg-[#1b1712] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)] w-[calc(100%-32px)]">
            <button
              type="button"
              onClick={closeForm}
              aria-label="Schließen"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-md text-muted transition-colors duration-200 hover:text-fg"
            >
              ✕
            </button>
            <h2 className="pr-12 text-xl font-semibold text-fg">
              {editing ? "Kleidungsstück bearbeiten" : "Neues Kleidungsstück"}
            </h2>
            <div className="mt-4">
              <ItemForm
                initial={editing}
                onSubmit={handleSubmit}
                onCancel={closeForm}
                submitting={submitting}
                error={formError}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
