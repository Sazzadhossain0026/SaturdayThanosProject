import { CartExtras, CartLine, MenuItem, SpiceLevel } from "./types";

export const SPICE_LEVELS: SpiceLevel[] = [
  "Mild",
  "Medium",
  "Hot",
  "Bangladeshi Hot",
];

export const EXTRA_PRICES = {
  extraChili: 0.5,
  extraOnion: 0.5,
  extraSauce: 0.5,
  extraTamarind: 0.75,
} as const;

export const EXTRA_LABELS: Record<keyof CartExtras, string> = {
  extraChili: "Extra Chili",
  extraOnion: "Extra Onion",
  extraSauce: "Extra Sauce",
  extraTamarind: "Extra Tamarind Sauce",
};

export const DEFAULT_EXTRAS: CartExtras = {
  extraChili: false,
  extraOnion: false,
  extraSauce: false,
  extraTamarind: false,
};

export function extrasTotal(extras: CartExtras): number {
  return (Object.keys(extras) as (keyof CartExtras)[]).reduce(
    (sum, key) => sum + (extras[key] ? EXTRA_PRICES[key] : 0),
    0,
  );
}

export function extrasLabelList(extras: CartExtras): string[] {
  return (Object.keys(extras) as (keyof CartExtras)[])
    .filter((key) => extras[key])
    .map((key) => EXTRA_LABELS[key]);
}

let lineCounter = 0;
export function makeLineId(): string {
  lineCounter += 1;
  return `line-${Date.now()}-${lineCounter}`;
}

export function buildCartLine(
  item: MenuItem,
  spiceLevel: SpiceLevel,
  extras: CartExtras,
  quantity: number,
  instructions: string,
): CartLine {
  const unitPrice = item.price + extrasTotal(extras);
  return {
    lineId: makeLineId(),
    menuItemId: item.id,
    name: item.name,
    emoji: item.emoji,
    gradient: item.gradient,
    basePrice: item.price,
    spiceLevel,
    extras,
    quantity,
    instructions: instructions.trim(),
    unitPrice,
    lineTotal: Math.round(unitPrice * quantity * 100) / 100,
  };
}

export function recalcLine(line: CartLine, quantity: number): CartLine {
  return {
    ...line,
    quantity,
    lineTotal: Math.round(line.unitPrice * quantity * 100) / 100,
  };
}
