import { getBaseUrl } from "../api/client";

export function imageSrc(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${getBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function OutfitCard({ outfit, onOpen, onDelete, busy = false }) {
  const items = outfit.items || [];
  const preview = items.slice(0, 4);

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-line bg-[#1b1712] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-fg">{outfit.name}</h3>
        <span className="rounded-pill border border-line px-3 py-1 text-[13px] text-muted">
          {items.length} {items.length === 1 ? "Stück" : "Stücke"}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-4 gap-1">
          {preview.map((item) => (
            <div
              key={item.id}
              className="relative aspect-[4/5] overflow-hidden rounded-md bg-[#0f0d0a]"
            >
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
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Noch keine Stücke enthalten.</p>
      )}

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          className="min-h-12 flex-1 rounded-md bg-accent px-4 py-3 font-semibold tracking-wide text-bg transition duration-200 hover:bg-[#e2c25c] disabled:cursor-not-allowed disabled:opacity-45"
          onClick={() => onOpen(outfit)}
          disabled={busy}
        >
          Öffnen
        </button>
        <button
          type="button"
          className="min-h-12 rounded-md border border-line bg-transparent px-4 py-3 text-fg transition duration-200 hover:border-muted hover:bg-[#1b1712] disabled:cursor-not-allowed disabled:opacity-45"
          onClick={() => onDelete(outfit.id)}
          disabled={busy}
          aria-label={`${outfit.name} löschen`}
        >
          Löschen
        </button>
      </div>
    </article>
  );
}
