import { MenuItem } from "./types";

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "beef-chap",
    name: "Beef Chap",
    price: 11,
    categories: ["Popular", "Chap"],
    description:
      "Slow-simmered beef chap in a rich, spiced Old Dhaka-style gravy. Our best seller.",
    emoji: "🍖",
    gradient: "from-orange-400 to-red-600",
    popular: true,
    spicy: true,
  },
  {
    id: "chicken-chap",
    name: "Chicken Chap",
    price: 10,
    categories: ["Popular", "Chap"],
    description:
      "Tender chicken chap simmered low and slow with caramelized onions and warm spices.",
    emoji: "🍗",
    gradient: "from-amber-400 to-orange-600",
    popular: true,
    spicy: true,
  },
  {
    id: "fuchka",
    name: "Fuchka",
    price: 7,
    categories: ["Popular", "Fuchka & Chotpoti"],
    description:
      "Crispy hollow puris filled with mashed potato, chickpeas & tangy tamarind water.",
    emoji: "🥟",
    gradient: "from-lime-400 to-emerald-600",
    popular: true,
    spicy: true,
  },
  {
    id: "doi-fuchka",
    name: "Doi Fuchka",
    price: 7,
    categories: ["Fuchka & Chotpoti"],
    description:
      "Classic fuchka topped with cooling sweet yogurt, tamarind & a hit of chaat masala.",
    emoji: "🥣",
    gradient: "from-sky-300 to-cyan-600",
    spicy: true,
  },
  {
    id: "mini-fuchka",
    name: "Mini Fuchka",
    price: 7,
    categories: ["Fuchka & Chotpoti"],
    description:
      "Bite-size fuchka, perfect for sharing — same bold tamarind & chili punch.",
    emoji: "🫓",
    gradient: "from-green-400 to-teal-600",
    spicy: true,
  },
  {
    id: "chotpoti",
    name: "Chotpoti",
    price: 7,
    categories: ["Popular", "Fuchka & Chotpoti"],
    description:
      "Yellow peas simmered with egg, tamarind & spices — Dhaka street food royalty.",
    emoji: "🍲",
    gradient: "from-yellow-400 to-orange-600",
    popular: true,
    spicy: true,
  },
  {
    id: "bhel-puri",
    name: "Bhel Puri",
    price: 7,
    categories: ["Street Snacks"],
    description:
      "Puffed rice tossed with fresh veggies, sev & a tangy-sweet tamarind dressing.",
    emoji: "🥗",
    gradient: "from-lime-300 to-green-600",
  },
  {
    id: "jhal-muri",
    name: "Jhal Muri",
    price: 6,
    categories: ["Street Snacks"],
    description:
      "Puffed rice tossed with mustard oil, chili, onion & spices. Fast, fiery, addictive.",
    emoji: "🌶️",
    gradient: "from-red-400 to-rose-600",
    spicy: true,
  },
  {
    id: "chanachur-makha",
    name: "Chanachur Makha",
    price: 7,
    categories: ["Street Snacks"],
    description:
      "Crunchy spiced chanachur mix hand-tossed with onion, chili & fresh lime.",
    emoji: "🥜",
    gradient: "from-amber-400 to-yellow-700",
    spicy: true,
  },
  {
    id: "special-jhalmuri",
    name: "Special Jhalmuri",
    price: 8,
    categories: ["Popular", "Street Snacks"],
    description:
      "Our loaded jhal muri with extra egg, boondi & a secret Gapush spice blend.",
    emoji: "🔥",
    gradient: "from-orange-500 to-red-700",
    popular: true,
    spicy: true,
  },
  {
    id: "cha",
    name: "Cha / Tea",
    price: 1,
    categories: ["Drinks"],
    description: "Hot milk tea brewed strong, roadside-stall style.",
    emoji: "☕",
    gradient: "from-amber-300 to-amber-700",
  },
  {
    id: "soda-water",
    name: "Soda / Water",
    price: 1,
    categories: ["Drinks"],
    description: "Ice-cold soda or bottled water to cool down the heat.",
    emoji: "🥤",
    gradient: "from-cyan-300 to-blue-600",
  },
  {
    id: "naga-shingara",
    name: "Naga Shingara",
    price: 5,
    categories: ["Street Snacks"],
    description:
      "Flaky fried pastry stuffed with spiced potato & naga chili for real heat-seekers.",
    emoji: "🥠",
    gradient: "from-yellow-500 to-orange-700",
    spicy: true,
  },
  {
    id: "orosh-biryani",
    name: "Orosh Biryani",
    price: 12,
    categories: ["Popular"],
    description:
      "Fragrant basmati biryani layered with tender meat & aromatic Bangladeshi spices.",
    emoji: "🍛",
    gradient: "from-yellow-400 to-amber-700",
    popular: true,
  },
  {
    id: "patenga-piyaji",
    name: "Patenga Piyaji",
    price: 5,
    categories: ["Street Snacks"],
    description:
      "Crispy onion & lentil fritters inspired by Chattogram's Patenga beach stalls.",
    emoji: "🧅",
    gradient: "from-orange-300 to-orange-700",
  },
];

export const MENU_CATEGORIES: MenuItem["categories"][number][] = [
  "Popular",
  "Chap",
  "Fuchka & Chotpoti",
  "Street Snacks",
  "Drinks",
];

export function getMenuItem(id: string): MenuItem | undefined {
  return MENU_ITEMS.find((item) => item.id === id);
}

export const TAX_RATE = 0.08875; // NYC combined sales tax
