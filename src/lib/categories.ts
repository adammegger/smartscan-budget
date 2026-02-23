import {
  Utensils,
  Car,
  Home,
  Heart,
  Tv,
  ShoppingBag,
  Receipt,
  BookOpen,
  Dumbbell,
  Sparkles,
  Dog,
  Gift,
  MoreHorizontal,
  Wallet,
  Coffee,
  Zap,
  Palette,
  Music,
  Gamepad2,
  Gamepad,
  Briefcase,
  GraduationCap,
  Plane,
  Building2,
  CreditCard,
  Shirt,
  WalletCards,
  TrendingUp,
  Leaf,
  Baby,
  Smile,
  Scissors,
  PawPrint,
  Dumbbell as Fitness,
  Hotel,
  Bus,
  Train,
  Bike,
  DollarSign,
  Fuel,
  Smartphone,
  Pill,
  Ticket,
  Candy,
  TreePine,
  Bath,
  Cpu,
  Wine,
  LayoutGrid,
} from "lucide-react";

// Map icon names from database to lucide-react components
// Key = icon name from database, Value = lucide-react component
export const iconMap: Record<
  string,
  React.ComponentType<{
    className?: string;
    size?: number;
    style?: React.CSSProperties;
  }>
> = {
  // Electronics
  Cpu,
  // Car (stacje benzynowe)
  Fuel,
  // Pharmacy
  Pill,
  // Entertainment
  Gamepad,
  // Education
  BookOpen,
  // Alcohol
  Wine,
  // Bills
  Receipt,
  // Health
  Heart,
  // Multi category (mixed receipts) - Polish
  Multi: LayoutGrid,
  Mieszane: LayoutGrid,
  // Polish category icons
  Jedzenie: Utensils,
  Transport: Car,
  Dom: Home,
  Zdrowie: Heart,
  Rozrywka: Gamepad,
  Inne: ShoppingBag,
  Uroda: Sparkles,
  Elektronika: Cpu,
  Zwierzęta: PawPrint,
  Ubrania: Shirt,
  Sport: Dumbbell,
  Edukacja: GraduationCap,
  Apteka: Pill,
  Alkohol: Wine,
  Podróże: Plane,
  Prezenty: Gift,
  Rachunki: Receipt,
  Restauracje: Coffee,
  // Default/fallback icons
  Utensils,
  Car,
  Home,
  Tv,
  ShoppingBag,
  Dumbbell,
  Sparkles,
  Dog,
  Gift,
  MoreHorizontal,
  Wallet,
  Coffee,
  Zap,
  Palette,
  Music,
  Gamepad2,
  Briefcase,
  GraduationCap,
  Plane,
  Building2,
  CreditCard,
  Shirt,
  WalletCards,
  TrendingUp,
  Leaf,
  Baby,
  Smile,
  Scissors,
  PawPrint,
  Fitness,
  Hotel,
  Bus,
  Train,
  Bike,
  DollarSign,
  Smartphone,
  Ticket,
  Candy,
  TreePine,
  Bath,
};

// Helper to get icon component by name
export function getIconComponent(iconName: string) {
  return iconMap[iconName] || MoreHorizontal;
}

// Helper function to determine receipt category based on items
// This implements the smart categorization logic:
// 1. If only one item, use that item's category
// 2. If a category is >= 70% of total, use that category (Domination Rule)
// 3. If >= 3 categories each have >= 15%, use "Multi"
// 4. Otherwise, use the category with highest percentage
export function determineReceiptCategory(
  items: Array<{ category: string; price: number }>,
  totalAmount: number,
): string {
  if (!items || items.length === 0) {
    return "Inne";
  }

  // If only one item, use that item's category
  if (items.length === 1) {
    return items[0].category || "Inne";
  }

  // Group items by category and sum prices
  const categoryTotals: Record<string, number> = {};
  items.forEach((item) => {
    const cat = item.category || "Inne";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + item.price;
  });

  // Calculate percentages
  const categoryPercentages: Array<{ category: string; percentage: number }> =
    [];
  Object.entries(categoryTotals).forEach(([category, total]) => {
    const percentage = (total / totalAmount) * 100;
    categoryPercentages.push({ category, percentage });
  });

  // Sort by percentage descending
  categoryPercentages.sort((a, b) => b.percentage - a.percentage);

  const topCategory = categoryPercentages[0];

  // Domination Rule: if top category >= 70%, use it
  if (topCategory.percentage >= 70) {
    return topCategory.category;
  }

  // Multi Rule: if >= 3 categories each have >= 15%
  const significantCategories = categoryPercentages.filter(
    (c) => c.percentage >= 15,
  );
  if (significantCategories.length >= 3) {
    return "Mieszane";
  }

  // Otherwise, use the top category
  return topCategory.category;
}

// Default categories for receipts (in Polish) - matches database
export const DEFAULT_CATEGORIES = [
  "Jedzenie",
  "Transport",
  "Dom",
  "Zdrowie",
  "Rozrywka",
  "Inne",
  "Uroda",
  "Elektronika",
  "Zwierzęta",
  "Ubrania",
  "Sport",
  "Edukacja",
  "Apteka",
  "Alkohol",
  "Podróże",
  "Prezenty",
  "Rachunki",
  "Restauracje",
];

// Keyword mapping for auto-categorization of new items
export const KEYWORD_CATEGORIES: Record<string, string[]> = {
  Jedzenie: [
    "chleb",
    "mleko",
    "ser",
    "masło",
    "jajka",
    "jajko",
    "mięso",
    "kurczak",
    "wołowina",
    "wieprzowina",
    "szynka",
    "kielbasa",
    "boczek",
    "owoce",
    "jabłko",
    "banan",
    "pomarańcz",
    "winogrona",
    "warzywa",
    "cebula",
    "ziemniaki",
    "marchewka",
    "pomidor",
    "ogórek",
    "sałata",
    "kapusta",
    "papryka",
    "ryż",
    "makaron",
    "kasza",
    "mąka",
    "kawa",
    "herbata",
    "cola",
    "woda",
    "sok",
    "piwo",
    "wino",
    "wódka",
    "chipsy",
    "orzechy",
    "czekolada",
    "baton",
    "ciastka",
    "bułka",
    "drożdżówka",
    "pączek",
    "jogurt",
    "kefir",
    "śmietana",
    "twaróg",
    "śledź",
    "dorsz",
    "łosoś",
    "makrela",
    "olej",
    "oliwa",
    "ocet",
    "musztarda",
    "ketchup",
    "majonez",
    "cukier",
    "sól",
    "pieprz",
    "przyprawa",
    "rosół",
    "zupa",
    "konserwa",
    "groch",
    "fasola",
    "soczewica",
    "pizza",
    "burger",
    "frytki",
    "zapiekanka",
    "kanapka",
    "tortilla",
    "kebab",
    "falafel",
    "sushi",
    "ramen",
    "pho",
    "pierogi",
    "pyzy",
    "naleśniki",
    "omlet",
    "jajecznica",
    "sałatka",
    "surówka",
    "bigos",
    "zurek",
    "żurek",
    "kapuśniak",
    "grochówka",
    "fasolka",
    "gulasz",
    "kotlet",
    "schabowy",
    "filet",
    "stek",
    "rostbef",
    "parówka",
    "kaczka",
    "gęś",
    "indyk",
    "królik",
    "dziczyzna",
  ],
  Transport: [
    "paliwo",
    "benzyna",
    "diesel",
    "lpg",
    "orl",
    "shell",
    "bp",
    "mobil",
    "lotos",
    "bis",
    "parking",
    "bilet",
    "autobus",
    "tramwaj",
    "pociąg",
    "metro",
    "taxi",
    "uber",
    "bolt",
    "winiet",
    "myto",
  ],
  Dom: [
    "papier toaletowy",
    "ręcznik",
    "chusteczki",
    "płyn do naczyń",
    "mop",
    "wiadro",
    "szmata",
    "proszek",
    "płyn",
    "żarówka",
    "świetlówka",
    "bateria",
    "akumulator",
    "wtyczka",
    "kabel",
    "taśma",
    "gwoździe",
    "śrub",
    "farb",
    "lakier",
    "rozcieńczalnik",
    "pędz",
    "folia",
    "torba",
    "work",
    "śmieci",
    "węgiel",
    "pellet",
    "gaz",
    "zmywak",
    "gąbka",
    "ściereczka",
    "kostka",
    "odświeżacz",
    "wosk",
    "past",
    "pojemnik",
    "pokrywka",
    "talerz",
    "sztućce",
    "kubek",
    "szklanka",
    "garnek",
    "patelnia",
    "blacha",
    "forma",
    "deska",
    "nóż",
    "łyżka",
    "widelec",
  ],
  Uroda: [
    "krem",
    "szampon",
    "mydło",
    "pasta do zębów",
    "szczoteczka",
    "dezodorant",
    "perfum",
    "woda toaletowa",
    "balsam",
    "maska",
    "olejek",
    "pomadka",
    "tusze",
    "cienie",
    "podkład",
    "korektor",
    "róż",
    "lakier do paznokci",
    "acet",
    "wazelina",
    "brylantyna",
    "pianka",
    "żel",
    "włosy",
  ],
  Zdrowie: [
    "witamina",
    "lek",
    "apap",
    "ibuprofen",
    "aspiryna",
    "polopiryna",
    "no-spa",
    "żelaxin",
    "magnez",
    "żelazo",
    "cynk",
    "witamina c",
    "witamina d",
    "bandaż",
    "plaster",
    "woda utleniona",
    "jodyna",
    "wacik",
    "patyczki",
    "termometr",
    "inhalator",
    "syrop",
    "krople",
    "maść",
    "gaza",
    "strzykawka",
    "prezerwatywa",
    "test ciążowy",
  ],
  // Additional Polish categories
  Elektronika: [
    "telefon",
    "laptop",
    "komputer",
    "telewizor",
    "tv",
    "radio",
    "słuchawki",
    "głośnik",
    "ładowarka",
    "kabel",
    "usb",
    "hdmi",
    "bateria",
    "akumulator",
    "led",
    "żarówka",
  ],
  Zwierzęta: [
    "karma",
    "pies",
    "kot",
    "zwierzę",
    "akwarium",
    "rybka",
    "ptak",
    "gryzon",
    "chomik",
    "królik",
    "smycz",
    "obroża",
    "żwirek",
    "karmnik",
  ],
  Ubrania: [
    "koszulka",
    "spodnie",
    "bluza",
    "kurtka",
    "buty",
    "skarpetki",
    "bielizna",
    "czapka",
    "rękawiczki",
    "szalik",
    "ubranie",
  ],
  Sport: [
    "piłka",
    "rakieta",
    "hantle",
    "mat",
    "aqua",
    "basen",
    "rower",
    "biegacz",
    "karnet",
    "siłownia",
  ],
  Edukacja: [
    "książka",
    "zeszyt",
    "długopis",
    "ołówek",
    "pióro",
    "plecak",
    "torebka",
    "przybornik",
    "linijka",
  ],
  Apteka: [
    "apteka",
    "lekarstwo",
    "tabletka",
    "syrop",
    "krople",
    "maść",
    "bandaż",
    "plaster",
  ],
};

// Map old categories to main categories (Polish)
export const CATEGORY_MAPPING: Record<string, string> = {
  // Food - Jedzenie
  Nabiał: "Jedzenie",
  Warzywa: "Jedzenie",
  Owoce: "Jedzenie",
  "Produkty suche": "Jedzenie",
  Mięso: "Jedzenie",
  Pieczywo: "Jedzenie",
  Napoje: "Jedzenie",
  Tłuszcze: "Jedzenie",
  Słodycze: "Jedzenie",
  Alkohol: "Jedzenie",
  // Transport
  Paliwo: "Transport",
  Parking: "Transport",
  // Home - Dom
  Dom: "Dom",
  Meble: "Dom",
  AGD: "Dom",
  // Health - Zdrowie
  Apteka: "Zdrowie",
  Zdrowie: "Zdrowie",
  Higiena: "Zdrowie",
  // Entertainment - Rozrywka
  Rozrywka: "Rozrywka",
  Kultura: "Rozrywka",
  Sport: "Rozrywka",
  // Other - Inne
  Chemia: "Inne",
  Ubrania: "Inne",
  Edukacja: "Inne",
  Prezenty: "Inne",
};

// Get main category from detailed category
export function getMainCategory(detailedCategory: string): string {
  return CATEGORY_MAPPING[detailedCategory] || "Inne";
}

// Get detailed tags from item
export function getItemTags(item: {
  category?: string;
  tags?: string[];
}): string[] {
  const tags: string[] = [];

  // Add the detailed category as a tag (only if it's not a main category)
  const mainCategories = [
    "Jedzenie",
    "Transport",
    "Dom",
    "Zdrowie",
    "Rozrywka",
    "Inne",
    "Mieszane",
  ];
  if (item.category && !mainCategories.includes(item.category)) {
    tags.push(item.category);
  }

  // Add any additional tags from the tags array
  if (item.tags && Array.isArray(item.tags)) {
    item.tags.forEach((tag) => {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    });
  }

  return tags;
}

// Auto-categorize item based on its name (for new items)
export function autoCategorizeItem(itemName: string): string {
  const nameLower = itemName.toLowerCase();

  for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        return category;
      }
    }
  }

  return "Inne";
}

// Category name to ID mapping (for database foreign keys)
// These IDs are from the Supabase database
export const CATEGORY_IDS: Record<string, string> = {
  Alkohol: "2b3aad52-1453-48b1-bb33-c7aa1fc85edf",
  Apteka: "0153d311-79ed-4454-a9c3-a191e0826bd3",
  Dom: "1526fc37-4ab5-421e-b3cd-58cc530137fb",
  Edukacja: "7fc62e41-b9d4-4912-8914-d00d4440dd2e",
  Elektronika: "2a37a75b-9a56-46fd-a130-430ffe581137",
  Inne: "0f176292-600b-43ea-8dba-10bab4da0249",
  Jedzenie: "4bd1ed8e-54c6-4920-b037-56dd46819c63",
  Podróże: "100edfc2-1f94-4778-b84f-211e9759052f",
  Prezenty: "1d8e7470-05c3-435f-a629-3c6292ae9272",
  Rachunki: "b2766faf-ba4d-4ef8-bdbc-48cdd01d4b49",
  Restauracje: "f57fa731-9ddf-42a0-a011-7f945b9dd610",
  Rozrywka: "8ee26835-9c1f-40cc-a5c7-55ddb47d546b",
  Sport: "37f1fc92-dead-4872-bd5e-0c01a299ecd9",
  Transport: "409fc9e7-15bb-492e-9309-07309869a3f9",
  Ubrania: "94293dd6-fe54-42a8-999f-6cd4f6eb6e3d",
  Uroda: "9e675dba-a0ae-492f-b704-ab7fa71554ad",
  Zdrowie: "76ebfe68-db58-4767-b5de-4ef2408bf0e4",
  Zwierzęta: "f7ee3fa7-5dba-47b2-8c27-ab03d8d7857c",
};

// Get category ID by category name
export function getCategoryId(categoryName: string): string | null {
  return CATEGORY_IDS[categoryName] || null;
}
