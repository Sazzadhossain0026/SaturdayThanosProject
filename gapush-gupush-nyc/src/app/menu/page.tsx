"use client";

import { useMemo, useState } from "react";
import { MENU_ITEMS } from "@/lib/menu-data";
import { MenuCategory, MenuItem } from "@/lib/types";
import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { ItemCustomizeModal } from "@/components/menu/ItemCustomizeModal";

export default function MenuPage() {
  const [category, setCategory] = useState<MenuCategory>("Popular");
  const [selected, setSelected] = useState<MenuItem | null>(null);

  const items = useMemo(
    () => MENU_ITEMS.filter((item) => item.categories.includes(category)),
    [category],
  );

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24">
      <div className="pt-6 pb-2">
        <h1 className="font-display text-3xl font-extrabold text-brand-ink">Menu</h1>
        <p className="text-sm text-brand-ink/50">
          Tap any item to customize spice level & extras.
        </p>
      </div>

      <CategoryTabs active={category} onChange={setCategory} />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} onSelect={setSelected} />
        ))}
      </div>

      {selected && (
        <ItemCustomizeModal item={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
