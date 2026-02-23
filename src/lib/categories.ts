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
  // Multi category (mixed receipts)
  Multi: LayoutGrid,
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
    return "Other";
  }

  // If only one item, use that item's category
  if (items.length === 1) {
    return items[0].category || "Other";
  }

  // Group items by category and sum prices
  const categoryTotals: Record<string, number> = {};
  items.forEach((item) => {
    const cat = item.category || "Other";
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
    return "Multi";
  }

  // Otherwise, use the top category
  return topCategory.category;
}

// Default categories for receipts
export const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Home",
  "Health",
  "Entertainment",
  "Other",
  "Multi",
];
