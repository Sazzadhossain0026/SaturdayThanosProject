"use client";

import { MENU_CATEGORIES } from "@/lib/menu-data";
import { MenuCategory } from "@/lib/types";

export function CategoryTabs({
  active,
  onChange,
}: {
  active: MenuCategory;
  onChange: (category: MenuCategory) => void;
}) {
  return (
    <div className="no-scrollbar sticky top-16 z-30 -mx-4 flex gap-2 overflow-x-auto bg-brand-cream/95 px-4 py-3 backdrop-blur-md">
      {MENU_CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            active === cat
              ? "border-brand-orange bg-brand-orange text-white shadow-sm"
              : "border-black/10 bg-white text-brand-ink/70"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
