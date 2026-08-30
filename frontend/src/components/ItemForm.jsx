import { useEffect, useState } from "react";
import { CATEGORIES } from "./CategoryFilter";

export default function ItemForm({ initial, onSubmit, onCancel, submitting, error }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fieldError, setFieldError] = useState("");

  const isEdit = Boolean(initial);

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFieldError("Bitte gib einen Namen ein.");
      return;
    }
    if (!category) {
      setFieldError("Bitte wähle eine Kategorie.");
      return;
    }
    if (!isEdit && !image) {
      setFieldError("Bitte wähle ein Bild aus.");
      return;
    }
    setFieldError("");
    onSubmit({ name: trimmed, category, image: isEdit ? undefined : image });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="item-name" className="text-sm text-muted">
          Name
        </label>
        <input
          id="item-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Schwarzes Abendkleid"
          className="min-h-12 rounded-md border border-line bg-bg px-4 py-3 text-fg placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="item-category" className="text-sm text-muted">
          Kategorie
        </label>
        <div className="relative">
          <select
            id="item-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-h-12 w-full appearance-none rounded-md border border-line bg-bg px-4 py-3 pr-10 text-fg transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20"
          >
            <option value="" disabled>
              Kategorie wählen …
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#1b1712] text-fg">
                {c.label}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
          >
            ▾
          </span>
        </div>
      </div>

      {!isEdit && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">Bild</span>
          <div className="rounded-lg border-[1.5px] border-dashed border-accent/45 bg-[#1b1712] p-6 text-center transition-colors duration-200">
            <input
              id="item-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="sr-only"
            />
            <label
              htmlFor="item-image"
              className="flex cursor-pointer flex-col items-center gap-2"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Vorschau"
                  className="max-h-60 rounded-md object-contain"
                />
              ) : (
                <>
                  <span aria-hidden="true" className="text-3xl text-muted">
                    ⬆
                  </span>
                  <span className="text-muted">
                    Bild auswählen oder hierher ziehen
                  </span>
                </>
              )}
            </label>
            {image && (
              <button
                type="button"
                onClick={() => setImage(null)}
                className="mt-2 text-sm text-muted underline-offset-2 hover:text-fg hover:underline"
              >
                Entfernen
              </button>
            )}
          </div>
        </div>
      )}

      {(fieldError || error) && (
        <p role="alert" className="text-[13px] text-[#c04a3a]">
          {fieldError || error}
        </p>
      )}

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 flex-1 rounded-md bg-accent px-6 py-3 font-semibold tracking-[0.02em] text-bg transition-all duration-200 hover:-translate-y-px hover:bg-[#e2c25c] hover:shadow-[0_6px_16px_rgba(212,175,55,0.25)] active:translate-y-0 active:bg-[#b8942e] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {submitting ? "Speichern …" : isEdit ? "Änderungen speichern" : "Hinzufügen"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-12 rounded-md border border-line bg-transparent px-6 py-3 text-fg transition-colors duration-200 hover:border-muted hover:bg-[#1b1712]"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
