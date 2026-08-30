import { useEffect, useMemo, useState } from "react";
import { imageSrc } from "./OutfitCard";

export const CATEGORY_LABELS = {
  oberteil: "Oberteil",
  hose: "Hose",
  kleid: "Kleid",
  schuhe: "Schuhe",
  accessoire: "Accessoire",
};

function Thumb({ item }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-[#0f0d0a]">
      <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-muted">
        {CATEGORY_LABELS[item.category] || item.name}
      </span>
      <img
        src={imageSrc(item.image_url)}
        alt={item.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

export default function OutfitCreator({
  wardrobeItems = [],
  outfit = null,
  busy = false,
  error = null,
  onCreate,
  onAddItem,
  onRemoveItem,
  onReplaceItem,
  onRename,
  onDelete,
  onCancelEdit,
}) {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const isEdit = Boolean(outfit);
  const outfitItems = outfit ? outfit.items || [] : [];

  useEffect(() => {
    if (outfit) {
      setName(outfit.name || "");
      setSelectedIds((outfit.items || []).map((item) => item.id));
    } else {
      setName("");
      setSelectedIds([]);
    }
  }, [outfit]);

  const outfitItemIds = useMemo(() => new Set(outfitItems.map((item) => item.id)), [outfitItems]);
  const addable = useMemo(
    () => wardrobeItems.filter((item) => !outfitItemIds.has(item.id)),
    [wardrobeItems, outfitItemIds]
  );
  const replaceable = useMemo(
    () => wardrobeItems.filter((item) => !outfitItemIds.has(item.id)),
    [wardrobeItems, outfitItemIds]
  );

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleCreate() {
    onCreate(name.trim(), selectedIds);
  }

  return (
    <div className="rounded-lg border border-line bg-[#1b1712] p-4">
      <h2 className="mb-3">{isEdit ? "Outfit bearbeiten" : "Neues Outfit erstellen"}</h2>

      {error ? (
        <p role="alert" className="mb-3 text-[13px] text-[#c04a3a]">
          {error}
        </p>
      ) : null}

      {isEdit ? (
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-col gap-3 md:w-1/3">
            <div className="flex flex-col gap-2">
              <label htmlFor="outfit-name" className="text-sm text-muted">
                Name
              </label>
              <input
                id="outfit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-12 rounded-md border border-line bg-bg px-4 py-3 text-fg placeholder-muted outline-none transition duration-200 focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.2)]"
                placeholder="Name des Outfits"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="min-h-12 flex-1 rounded-md bg-accent px-4 py-3 font-semibold tracking-wide text-bg transition duration-200 hover:bg-[#e2c25c] disabled:cursor-not-allowed disabled:opacity-45"
                  onClick={() => onRename(outfit.id, name.trim())}
                  disabled={busy || !name.trim()}
                >
                  Umbenennen
                </button>
                <button
                  type="button"
                  className="min-h-12 rounded-md border border-line bg-transparent px-4 py-3 text-fg transition duration-200 hover:border-muted disabled:cursor-not-allowed disabled:opacity-45"
                  onClick={onCancelEdit}
                  disabled={busy}
                >
                  Abbrechen
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted">Enthaltene Stücke</span>
              {outfitItems.length === 0 ? (
                <p className="text-sm text-muted">Noch keine Stücke enthalten.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {outfitItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-2 rounded-md border border-line p-2"
                    >
                      <div className="h-14 w-11 shrink-0">
                        <Thumb item={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-fg">{item.name}</p>
                        <p className="text-[13px] text-muted">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </p>
                      </div>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            onReplaceItem(outfit.id, item.id, Number(e.target.value));
                          }
                        }}
                        disabled={busy}
                        aria-label={`${item.name} ersetzen`}
                        className="min-h-12 rounded-md border border-line bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <option value="">Ersetzen…</option>
                        {replaceable.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-md border border-line text-muted transition duration-200 hover:border-accent hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={() => onRemoveItem(outfit.id, item.id)}
                        disabled={busy}
                        aria-label={`${item.name} entfernen`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    onAddItem(outfit.id, Number(e.target.value));
                  }
                }}
                disabled={busy || addable.length === 0}
                aria-label="Stück hinzufügen"
                className="min-h-12 rounded-md border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-45"
              >
                <option value="">Stück hinzufügen…</option>
                {addable.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="min-h-12 rounded-md bg-[#c04a3a] px-4 py-3 font-semibold tracking-wide text-fg transition duration-200 hover:bg-[#d15b4a] disabled:cursor-not-allowed disabled:opacity-45"
              onClick={() => onDelete(outfit.id)}
              disabled={busy}
            >
              Outfit löschen
            </button>
          </div>

          <div className="md:w-2/3">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {wardrobeItems.map((item) => (
                <div key={item.id} className="flex flex-col gap-2">
                  <Thumb item={item} />
                  <p className="truncate text-sm text-fg">{item.name}</p>
                  <p className="text-[13px] text-muted">
                    {outfitItemIds.has(item.id)
                      ? "Im Outfit enthalten"
                      : CATEGORY_LABELS[item.category] || item.category}
                  </p>
                </div>
              ))}
            </div>
            {wardrobeItems.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Keine Kleidungsstücke in der Garderobe vorhanden.
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-col gap-2 md:w-1/3">
            <label htmlFor="outfit-name" className="text-sm text-muted">
              Name
            </label>
            <input
              id="outfit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-12 rounded-md border border-line bg-bg px-4 py-3 text-fg placeholder-muted outline-none transition duration-200 focus:border-accent focus:shadow-[0_0_0_3px_rgba(212,175,55,0.2)]"
              placeholder="Name des Outfits"
            />
            <p className="text-[13px] text-muted">
              {selectedIds.length} {selectedIds.length === 1 ? "Stück" : "Stücke"} ausgewählt
            </p>
            <button
              type="button"
              className="min-h-12 rounded-md bg-accent px-4 py-3 font-semibold tracking-wide text-bg transition duration-200 hover:bg-[#e2c25c] disabled:cursor-not-allowed disabled:opacity-45"
              onClick={handleCreate}
              disabled={busy || !name.trim() || selectedIds.length === 0}
            >
              Outfit speichern
            </button>
          </div>

          <div className="md:w-2/3">
            {wardrobeItems.length === 0 ? (
              <p className="text-sm text-muted">
                Keine Kleidungsstücke in der Garderobe vorhanden. Lege zuerst Stücke in der
                Garderobe an.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {wardrobeItems.map((item) => {
                  const selected = selectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      aria-pressed={selected}
                      className={`flex flex-col gap-2 rounded-lg border p-2 text-left transition duration-200 ${
                        selected
                          ? "border-accent bg-[#d4af37]/10"
                          : "border-line bg-transparent hover:border-accent"
                      }`}
                    >
                      <Thumb item={item} />
                      <span className="truncate text-sm text-fg">{item.name}</span>
                      <span className="text-[13px] text-muted">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
