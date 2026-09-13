"use client";

import { useEffect, useMemo, useState } from "react";
import { MENU_ITEMS } from "@/lib/menu-data";
import { MenuCategory, MenuItem } from "@/lib/types";
import { CategoryTabs } from "@/components/menu/CategoryTabs";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { ItemCustomizeModal } from "@/components/menu/ItemCustomizeModal";
import { fetchInventory } from "@/lib/api-client";

export default function MenuPage() {
  const [category, setCategory] = useState<MenuCategory>("Popular");
  const [selected, setSelected] = useState<MenuItem | null>(null);
  // Only ever has entries for the handful of intentionally-limited items
  // (see src/server/db.ts) — everything else has "unlimited" stock and
  // just doesn't get a badge.
  const [stock, setStock] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { inventory } = await fetchInventory();
        if (cancelled) return;
        const limited: Record<string, number> = {};
        for (const row of inventory) {
          if (row.is_limited) limited[row.menu_item_id] = row.quantity_available;
        }
        setStock(limited);
      } catch {
        // Inventory badges are a nice-to-have — silently skip on a bad
        // connection rather than blocking the menu from rendering.
      }
    }
    load();
    const id = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

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
          <MenuItemCard
            key={item.id}
            item={item}
            onSelect={setSelected}
            stockLeft={item.id in stock ? stock[item.id] : undefined}
          />
        ))}
      </div>

      {selected && (
        <ItemCustomizeModal item={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
