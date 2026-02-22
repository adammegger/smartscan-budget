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
