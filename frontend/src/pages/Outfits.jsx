import { useCallback, useEffect, useMemo, useState } from "react";
import client from "../api/client";
import OutfitCard from "../components/OutfitCard";
import OutfitCreator from "../components/OutfitCreator";

async function unwrap(res) {
  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }
  let detail = "Es ist ein Fehler aufgetreten.";
  try {
    const data = await res.json();
    if (data && typeof data.detail === "string") {
      detail = data.detail;
    }
  } catch {
    // Non-JSON error body: keep the generic message.
  }
  throw new Error(detail);
}

export default function Outfits() {
  const [outfits, setOutfits] = useState([]);
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [outfitsError, setOutfitsError] = useState(null);
  const [itemsError, setItemsError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOutfits() {
      try {
        const data = await unwrap(await client.get("/api/outfits"));
        if (!cancelled) setOutfits(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setOutfitsError(e.message || "Outfits konnten nicht geladen werden.");
      }
    }

    async function loadItems() {
      try {
        const data = await unwrap(await client.get("/api/wardrobe/items"));
        if (!cancelled) setWardrobeItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setItemsError(e.message || "Garderobe konnte nicht geladen werden.");
      }
    }

    Promise.all([loadOutfits(), loadItems()]).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const editingOutfit = useMemo(
    () => outfits.find((outfit) => outfit.id === editingId) || null,
    [outfits, editingId]
  );

  async function run(action) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
    } catch (e) {
      setActionError(e.message || "Aktion fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  const createOutfit = useCallback(
    (name, itemIds) =>
      run(async () => {
        const created = await unwrap(
          await client.post("/api/outfits", { name, item_ids: itemIds })
        );
        setOutfits((prev) => [...prev, created]);
      }),
    []
  );

  const deleteOutfit = useCallback(
    (id) =>
      run(async () => {
        await unwrap(await client.delete(`/api/outfits/${id}`));
        setOutfits((prev) => prev.filter((outfit) => outfit.id !== id));
        setEditingId((prev) => (prev === id ? null : prev));
      }),
    []
  );

  const renameOutfit = useCallback(
    (id, name) =>
      run(async () => {
        const updated = await unwrap(await client.patch(`/api/outfits/${id}`, { name }));
        setOutfits((prev) => prev.map((outfit) => (outfit.id === id ? updated : outfit)));
      }),
    []
  );

  const addItem = useCallback(
    (id, itemId) =>
      run(async () => {
        const updated = await unwrap(
          await client.post(`/api/outfits/${id}/items`, { item_id: itemId })
        );
        setOutfits((prev) => prev.map((outfit) => (outfit.id === id ? updated : outfit)));
      }),
    []
  );

  const removeItem = useCallback(
    (id, itemId) =>
      run(async () => {
        const updated = await unwrap(
          await client.delete(`/api/outfits/${id}/items/${itemId}`)
        );
        setOutfits((prev) => prev.map((outfit) => (outfit.id === id ? updated : outfit)));
      }),
    []
  );

  const replaceItem = useCallback(
    (id, itemId, newItemId) =>
      run(async () => {
        const updated = await unwrap(
          await client.put(`/api/outfits/${id}/items/${itemId}`, { new_item_id: newItemId })
        );
        setOutfits((prev) => prev.map((outfit) => (outfit.id === id ? updated : outfit)));
      }),
    []
  );

  return (
    <section className="page">
      <h1 className="mb-4">Outfits</h1>

      <OutfitCreator
        wardrobeItems={wardrobeItems}
        outfit={editingOutfit}
        busy={busy}
        error={actionError}
        onCreate={createOutfit}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onReplaceItem={replaceItem}
        onRename={renameOutfit}
        onDelete={deleteOutfit}
        onCancelEdit={() => setEditingId(null)}
      />

      <div className="mt-6">
        <h2 className="mb-3">Gespeicherte Outfits</h2>

        {loading ? (
          <p className="text-muted">Outfits werden geladen…</p>
        ) : outfitsError ? (
          <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
            <p className="text-muted">{outfitsError}</p>
          </div>
        ) : outfits.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
            <h3 className="text-lg font-semibold text-fg">Noch keine Outfits gespeichert</h3>
            <p className="mx-auto mt-2 max-w-[420px] text-[15px] text-muted">
              Stelle oben dein erstes Outfit aus deinen Garderobenstücken zusammen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {outfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                onOpen={(opened) => setEditingId(opened.id)}
                onDelete={deleteOutfit}
                busy={busy}
              />
            ))}
          </div>
        )}
      </div>

      {itemsError ? (
        <p className="mt-4 text-sm text-[#c04a3a]">{itemsError}</p>
      ) : null}
    </section>
  );
}
