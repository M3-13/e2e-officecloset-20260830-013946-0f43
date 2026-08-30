import { getBaseUrl } from "../api/client";
import { categoryLabel } from "./CategoryFilter";

function resolveImageUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${getBaseUrl()}${url}`;
}

export default function ItemCard({ item, onEdit, onDelete }) {
  const imageSrc = resolveImageUrl(item.image_url);

  return (
    <article className="group overflow-hidden rounded-lg border border-line bg-[#1b1712] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
      <div className="mb-3 aspect-[4/5] overflow-hidden rounded-md bg-[#0f0d0a]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <span aria-hidden="true" className="text-3xl">
              ✦
            </span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-fg">{item.name}</h3>
          <span className="mt-1 inline-flex min-h-[28px] items-center rounded-pill border border-line bg-transparent px-3 py-1 text-[13px] text-muted">
            {categoryLabel(item.category)}
          </span>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`${item.name} bearbeiten`}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`${item.name} löschen`}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted transition-colors duration-200 hover:border-[#c04a3a] hover:text-[#c04a3a]"
          >
            ✕
          </button>
        </div>
      </div>
    </article>
  );
}
