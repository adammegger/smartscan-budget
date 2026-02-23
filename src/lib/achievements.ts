import { supabase } from "./supabase";
import {
  Trophy,
  Zap,
  ShieldCheck,
  Flame,
  Target,
  Star,
  Award,
  TrendingUp,
  Calendar,
  ShoppingBag,
} from "lucide-react";

// Achievement type definitions
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  threshold: number;
}

export interface UserAchievement {
  id: number;
  user_id: string;
  type: string;
  value: number;
  awarded_at: string;
}

// Achievement definitions
export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first_receipt",
    name: "Pierwszy krok",
    description: "Zeskanuj swój pierwszy paragon",
    icon: "Trophy",
    requirement: "first_receipt",
    threshold: 1,
  },
  {
    id: "streak_7_days",
    name: "Seria tygodniowa",
    description: "Skanuj paragony 7 dni z rzędu",
    icon: "Flame",
    requirement: "streak_7_days",
    threshold: 7,
  },
  {
    id: "streak_30_days",
    name: "Miesięczna seria",
    description: "Skanuj paragony 30 dni z rzędu",
    icon: "Flame",
    requirement: "streak_30_days",
    threshold: 30,
  },
  {
    id: "receipts_10",
    name: "Początek kolekcji",
    description: "Zeskanuj 10 paragonów",
    icon: "ShoppingBag",
    requirement: "total_receipts",
    threshold: 10,
  },
  {
    id: "receipts_50",
    name: "Kolekcjoner",
    description: "Zeskanuj 50 paragonów",
    icon: "Award",
    requirement: "total_receipts",
    threshold: 50,
  },
  {
    id: "receipts_100",
    name: "Mistrz kolekcji",
    description: "Zeskanuj 100 paragonów",
    icon: "Trophy",
    requirement: "total_receipts",
    threshold: 100,
  },
  {
    id: "budget_set",
    name: "Planista",
    description: "Ustaw pierwszy budżet",
    icon: "Target",
    requirement: "budgets_created",
    threshold: 1,
  },
  {
    id: "budgets_5",
    name: "Menedżer finansów",
    description: "Ustaw 5 budżetów",
    icon: "ShieldCheck",
    requirement: "budgets_created",
    threshold: 5,
  },
  {
    id: "categories_5",
    name: "Eksplorator",
    description: "Wydaj pieniądze w 5 kategoriach",
    icon: "Star",
    requirement: "unique_categories",
    threshold: 5,
  },
  {
    id: "categories_all",
    name: "Wszechstronny",
    description: "Wydaj pieniądze we wszystkich kategoriach",
    icon: "Zap",
    requirement: "unique_categories",
    threshold: 14,
  },
  {
    id: "spending_1000",
    name: "Tysiącznik",
    description: "Wydaj łącznie 1000 PLN",
    icon: "TrendingUp",
    requirement: "total_spent",
    threshold: 1000,
  },
  {
    id: "spending_10000",
    name: "Wielki wydawca",
    description: "Wydaj łącznie 10000 PLN",
    icon: "Trophy",
    requirement: "total_spent",
    threshold: 10000,
  },
];

// Map icon names to components
const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  Trophy,
  Zap,
  ShieldCheck,
  Flame,
  Target,
  Star,
  Award,
  TrendingUp,
  Calendar,
  ShoppingBag,
};

export function getAchievementIcon(iconName: string) {
  return iconMap[iconName] || Trophy;
}

// Check and award achievements after a new receipt is added
export async function checkAchievements(userId: string): Promise<string[]> {
  const newAchievements: string[] = [];

  try {
    // Get existing achievements
    const { data: existingAchievements } = await supabase
      .from("achievements")
      .select("type")
      .eq("user_id", userId);

    const earnedTypes = new Set(existingAchievements?.map((a) => a.type) || []);

    // Get receipt statistics
    const { data: receipts } = await supabase
      .from("receipts")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    // Get unique categories and spending from items
    const { data: items } = await supabase
      .from("items")
      .select("category, price")
      .eq("user_id", userId);

    const uniqueCategories = new Set(items?.map((i) => i.category) || []);

    // Get budgets count
    const { count: budgetsCount } = await supabase
      .from("budgets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Calculate total spent
    const totalSpent =
      items?.reduce((sum, item) => {
        const price =
          typeof item.price === "number"
            ? item.price
            : parseFloat(String(item.price).replace(",", "."));
        return sum + (price || 0);
      }, 0) || 0;

    // Calculate streak (consecutive days with receipts)
    const receiptDates = receipts?.map((r) => r.date) || [];
    let streak = 0;
    if (receiptDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let checkDate = new Date(today);
      let foundGap = false;

      while (
        !foundGap &&
        receiptDates.includes(checkDate.toISOString().split("T")[0])
      ) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Check each achievement
    const checks = [
      {
        id: "first_receipt",
        condition: receipts && receipts.length >= 1,
      },
      {
        id: "receipts_10",
        condition: receipts && receipts.length >= 10,
      },
      {
        id: "receipts_50",
        condition: receipts && receipts.length >= 50,
      },
      {
        id: "receipts_100",
        condition: receipts && receipts.length >= 100,
      },
      {
        id: "streak_7_days",
        condition: streak >= 7,
      },
      {
        id: "streak_30_days",
        condition: streak >= 30,
      },
      {
        id: "budget_set",
        condition: budgetsCount && budgetsCount >= 1,
      },
      {
        id: "budgets_5",
        condition: budgetsCount && budgetsCount >= 5,
      },
      {
        id: "categories_5",
        condition: uniqueCategories.size >= 5,
      },
      {
        id: "categories_all",
        condition: uniqueCategories.size >= 14,
      },
      {
        id: "spending_1000",
        condition: totalSpent >= 1000,
      },
      {
        id: "spending_10000",
        condition: totalSpent >= 10000,
      },
    ];

    // Award new achievements
    for (const check of checks) {
      if (check.condition && !earnedTypes.has(check.id)) {
        const { error } = await supabase.from("achievements").insert({
          user_id: userId,
          type: check.id,
          value: 1,
        });

        if (!error) {
          newAchievements.push(check.id);
          earnedTypes.add(check.id);
        }
      }
    }
  } catch (err) {
    console.error("Error checking achievements:", err);
  }

  return newAchievements;
}

// Fetch all user achievements
export async function fetchUserAchievements(
  userId: string,
): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false });

  if (error) {
    console.error("Error fetching achievements:", error);
    return [];
  }

  return data || [];
}
