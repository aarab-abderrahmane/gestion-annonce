"use client";

type CategoryOption =
  | string
  | {
      label: string;
      value: string;
    };

type CategoryFilterProps = {
  categories: CategoryOption[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
};

export default function CategoryFilter({
  categories,
  value,
  onChange,
  allLabel = "الكل",
}: CategoryFilterProps) {
  const options = categories.map((category) =>
    typeof category === "string"
      ? { label: category, value: category }
      : category,
  );

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={`md-chip ${value === "all" ? "md-chip-selected" : ""}`.trim()}
      >
        {allLabel}
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`md-chip ${value === option.value ? "md-chip-selected" : ""}`.trim()}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
