export const CATEGORIES = [
  { value: "oberteil", label: "Oberteile" },
  { value: "hose", label: "Hosen" },
  { value: "kleid", label: "Kleider" },
  { value: "schuhe", label: "Schuhe" },
  { value: "accessoire", label: "Accessoires" },
];

export function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export default function CategoryFilter({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Kategorie-Filter">
      <button
        type="button"
        aria-pressed={selected === null}
        onClick={() => onChange(null)}
        className={`inline-flex min-h-[28px] items-center rounded-pill border px-3 py-1 text-[13px] transition-colors duration-200 ${
          selected === null
            ? "border-accent bg-accent font-semibold text-bg"
            : "border-line bg-transparent text-muted hover:border-accent hover:text-accent"
        }`}
      >
        Alle
      </button>
      {CATEGORIES.map((category) => {
        const active = selected === category.value;
        return (
          <button
            key={category.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : category.value)}
            className={`inline-flex min-h-[28px] items-center rounded-pill border px-3 py-1 text-[13px] transition-colors duration-200 ${
              active
                ? "border-accent bg-accent font-semibold text-bg"
                : "border-line bg-transparent text-muted hover:border-accent hover:text-accent"
            }`}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
