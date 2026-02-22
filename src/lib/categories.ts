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
  Briefcase,
  GraduationCap,
  Plane,
  Building2,
  CreditCard,
} from "lucide-react";

// Map icon names from database to lucide-react components
export const iconMap: Record<
  string,
  React.ComponentType<{
    className?: string;
    size?: number;
    style?: React.CSSProperties;
  }>
> = {
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
  Briefcase,
  GraduationCap,
  Plane,
  Building2,
  CreditCard,
};

// Helper to get icon component by name
export function getIconComponent(iconName: string) {
  return iconMap[iconName] || MoreHorizontal;
}
