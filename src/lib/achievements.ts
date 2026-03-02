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
  Leaf,
  Clover,
  Wallet,
  Coins,
  Moon,
  CalendarHeart,
  PartyPopper,
  ScanLine,
  Receipt,
  Barcode,
  Camera,
  ClipboardList,
  Crown,
  PiggyBank,
  CreditCard,
  Landmark,
  Gem,
  Sprout,
  Flower2,
  TreePine,
  Trees,
  Recycle,
  Globe,
  Medal,
  BadgeDollarSign,
  HandCoins,
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
  // First Receipt
  {
    id: "first_receipt",
    name: "Pierwszy krok",
    description: "Zeskanuj swój pierwszy paragon",
    icon: "ScanLine",
    requirement: "first_receipt",
    threshold: 1,
  },

  // Receipts Count (Skanowanie paragonów)
  {
    id: "receipts_10",
    name: "Początek kolekcji",
    description: "Zeskanuj 10 paragonów",
    icon: "Receipt",
    requirement: "total_receipts",
    threshold: 10,
  },
  {
    id: "receipts_25",
    name: "Ćwierć setki",
    description: "Zeskanuj 25 paragonów",
    icon: "Barcode",
    requirement: "total_receipts",
    threshold: 25,
  },
  {
    id: "receipts_50",
    name: "Kolekcjoner",
    description: "Zeskanuj 50 paragonów",
    icon: "Camera",
    requirement: "total_receipts",
    threshold: 50,
  },
  {
    id: "receipts_100",
    name: "Mistrz kolekcji",
    description: "Zeskanuj 100 paragonów",
    icon: "ClipboardList",
    requirement: "total_receipts",
    threshold: 100,
  },
  {
    id: "receipts_500",
    name: "Weteran Skanowania",
    description: "Zeskanuj 500 paragonów",
    icon: "Award",
    requirement: "total_receipts",
    threshold: 500,
  },
  {
    id: "receipts_1000",
    name: "Król Paragonów",
    description: "Zeskanuj 1000 paragonów",
    icon: "Crown",
    requirement: "total_receipts",
    threshold: 1000,
  },

  // Spending (Wydatki)
  {
    id: "spending_1000",
    name: "Tysiącznik",
    description: "Wydaj łącznie 1000 PLN",
    icon: "Coins",
    requirement: "total_spent",
    threshold: 1000,
  },
  {
    id: "spending_10000",
    name: "Wielki wydawca",
    description: "Wydaj łącznie 10000 PLN",
    icon: "PiggyBank",
    requirement: "total_spent",
    threshold: 10000,
  },
  {
    id: "spending_20000",
    name: "Hojny Klient",
    description: "Wydaj łącznie 20 000 PLN",
    icon: "CreditCard",
    requirement: "total_spent",
    threshold: 20000,
  },
  {
    id: "spending_50000",
    name: "Złota Karta",
    description: "Wydaj łącznie 50 000 PLN",
    icon: "Landmark",
    requirement: "total_spent",
    threshold: 50000,
  },
  {
    id: "spending_100000",
    name: "Krezus",
    description: "Wydaj łącznie 100 000 PLN",
    icon: "Gem",
    requirement: "total_spent",
    threshold: 100000,
  },

  // Budgets
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

  // Categories
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

  // Streaks
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

  // Eco achievements (Zielone Listki / BIO)
  {
    id: "green_leaves_1",
    name: "Pierwszy Listek",
    description: "Zdobądź 1 punkt BIO",
    icon: "Leaf",
    requirement: "green_leaves_count",
    threshold: 1,
  },
  {
    id: "green_leaves_10",
    name: "Początkujący Zielarz",
    description: "Zbierz 10 Zielonych Listków",
    icon: "Sprout",
    requirement: "green_leaves_count",
    threshold: 10,
  },
  {
    id: "green_leaves_25",
    name: "Zielony Krok",
    description: "Zbierz 25 Zielonych Listków",
    icon: "Flower2",
    requirement: "green_leaves_count",
    threshold: 25,
  },
  {
    id: "green_leaves_50",
    name: "Eko-Entuzjasta",
    description: "Zbierz 50 Zielonych Listków",
    icon: "TreePine",
    requirement: "green_leaves_count",
    threshold: 50,
  },
  {
    id: "green_leaves_100",
    name: "Bio-Master",
    description: "Zbierz 100 Zielonych Listków",
    icon: "Trees",
    requirement: "green_leaves_count",
    threshold: 100,
  },
  {
    id: "green_leaves_250",
    name: "Miłośnik Planety",
    description: "Zbierz 250 Zielonych Listków",
    icon: "Recycle",
    requirement: "green_leaves_count",
    threshold: 250,
  },
  {
    id: "green_leaves_500",
    name: "Matka Natura",
    description: "Zbierz 500 Zielonych Listków",
    icon: "Globe",
    requirement: "green_leaves_count",
    threshold: 500,
  },
  {
    id: "green_leaves_1000",
    name: "Zbawca Świata",
    description: "Zbierz 1000 Zielonych Listków",
    icon: "Medal",
    requirement: "green_leaves_count",
    threshold: 1000,
  },

  // Special Achievements
  {
    id: "special_big_spender",
    name: "Gruby Portfel",
    description: "Zeskanuj jeden paragon na kwotę powyżej 500 zł",
    icon: "BadgeDollarSign",
    requirement: "special_big_spender",
    threshold: 1,
  },
  {
    id: "special_pennies",
    name: "Grosz do grosza",
    description: "Zeskanuj paragon na kwotę poniżej 10 zł",
    icon: "HandCoins",
    requirement: "special_pennies",
    threshold: 1,
  },
  {
    id: "special_night_owl",
    name: "Nocny Marek",
    description: "Zeskanuj paragon po 22:00",
    icon: "Moon",
    requirement: "special_night_owl",
    threshold: 1,
  },
  {
    id: "special_weekend",
    name: "Weekendowy Szoping",
    description: "Zeskanuj paragon z datą sobotnią lub niedzielną",
    icon: "CalendarHeart",
    requirement: "special_weekend",
    threshold: 1,
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
  Leaf,
  Clover,
  Wallet,
  Coins,
  Moon,
  CalendarHeart,
  PartyPopper,
  ScanLine,
  Receipt,
  Barcode,
  Camera,
  ClipboardList,
  Crown,
  PiggyBank,
  CreditCard,
  Landmark,
  Gem,
  Sprout,
  Flower2,
  TreePine,
  Trees,
  Recycle,
  Globe,
  Medal,
  BadgeDollarSign,
  HandCoins,
};

export function getAchievementIcon(iconName: string) {
  const icon = iconMap[iconName];
  if (!icon) {
    console.warn(`Icon not found for: ${iconName}`);
  }
  return icon || Trophy;
}

// Check and award achievements after a new receipt is added
export async function checkAchievements(
  userId: string,
  newReceipt?: {
    total_amount: number;
    date: string;
  },
): Promise<string[]> {
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

      const checkDate = new Date(today);
      while (receiptDates.includes(checkDate.toISOString().split("T")[0])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Get green leaves from profile - this is now automatically updated by database trigger
    const { data: profile } = await supabase
      .from("profiles")
      .select("green_leaves_count")
      .eq("id", userId)
      .single();

    const greenLeavesCount = profile?.green_leaves_count || 0;

    // Check each achievement
    const checks = [
      // First Receipt
      {
        id: "first_receipt",
        condition: receipts && receipts.length >= 1,
      },

      // Receipts Count
      {
        id: "receipts_1",
        condition: receipts && receipts.length >= 1,
      },
      {
        id: "receipts_10",
        condition: receipts && receipts.length >= 10,
      },
      {
        id: "receipts_25",
        condition: receipts && receipts.length >= 25,
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
        id: "receipts_500",
        condition: receipts && receipts.length >= 500,
      },
      {
        id: "receipts_1000",
        condition: receipts && receipts.length >= 1000,
      },

      // Spending
      {
        id: "spending_1000",
        condition: totalSpent >= 1000,
      },
      {
        id: "spending_10000",
        condition: totalSpent >= 10000,
      },
      {
        id: "spending_20000",
        condition: totalSpent >= 20000,
      },
      {
        id: "spending_50000",
        condition: totalSpent >= 50000,
      },
      {
        id: "spending_100000",
        condition: totalSpent >= 100000,
      },

      // Budgets
      {
        id: "budget_set",
        condition: budgetsCount && budgetsCount >= 1,
      },
      {
        id: "budgets_5",
        condition: budgetsCount && budgetsCount >= 5,
      },

      // Categories
      {
        id: "categories_5",
        condition: uniqueCategories.size >= 5,
      },
      {
        id: "categories_all",
        condition: uniqueCategories.size >= 14,
      },

      // Streaks
      {
        id: "streak_7_days",
        condition: streak >= 7,
      },
      {
        id: "streak_30_days",
        condition: streak >= 30,
      },

      // Eco achievements
      {
        id: "green_leaves_1",
        condition: greenLeavesCount >= 1,
      },
      {
        id: "green_leaves_10",
        condition: greenLeavesCount >= 10,
      },
      {
        id: "green_leaves_25",
        condition: greenLeavesCount >= 25,
      },
      {
        id: "green_leaves_50",
        condition: greenLeavesCount >= 50,
      },
      {
        id: "green_leaves_100",
        condition: greenLeavesCount >= 100,
      },
      {
        id: "green_leaves_250",
        condition: greenLeavesCount >= 250,
      },
      {
        id: "green_leaves_500",
        condition: greenLeavesCount >= 500,
      },
      {
        id: "green_leaves_1000",
        condition: greenLeavesCount >= 1000,
      },
    ];

    // Check special achievements if new receipt data is provided
    if (newReceipt) {
      // Check special_big_spender (Gruby Portfel)
      if (
        newReceipt.total_amount > 500 &&
        !earnedTypes.has("special_big_spender")
      ) {
        const { error } = await supabase.from("achievements").insert({
          user_id: userId,
          type: "special_big_spender",
          value: 1,
        });

        if (!error) {
          newAchievements.push("special_big_spender");
          earnedTypes.add("special_big_spender");
        }
      }

      // Check special_pennies (Grosz do grosza)
      if (newReceipt.total_amount < 10 && !earnedTypes.has("special_pennies")) {
        const { error } = await supabase.from("achievements").insert({
          user_id: userId,
          type: "special_pennies",
          value: 1,
        });

        if (!error) {
          newAchievements.push("special_pennies");
          earnedTypes.add("special_pennies");
        }
      }

      // Check special_night_owl (Nocny Marek)
      const now = new Date();
      const currentHour = now.getHours();
      if (currentHour >= 22 || currentHour < 6) {
        if (!earnedTypes.has("special_night_owl")) {
          const { error } = await supabase.from("achievements").insert({
            user_id: userId,
            type: "special_night_owl",
            value: 1,
          });

          if (!error) {
            newAchievements.push("special_night_owl");
            earnedTypes.add("special_night_owl");
          }
        }
      }

      // Check special_weekend (Weekendowy Szoping)
      if (newReceipt.date) {
        const receiptDate = new Date(newReceipt.date);
        const dayOfWeek = receiptDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          if (!earnedTypes.has("special_weekend")) {
            const { error } = await supabase.from("achievements").insert({
              user_id: userId,
              type: "special_weekend",
              value: 1,
            });

            if (!error) {
              newAchievements.push("special_weekend");
              earnedTypes.add("special_weekend");
            }
          }
        }
      }
    }

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

// Sync missing achievements (retroactive unlock)
export async function syncMissingAchievements(
  userId: string,
): Promise<string[]> {
  const newAchievements: string[] = [];

  try {
    // Get user progress data
    const progressData = await fetchUserProgressData(userId);

    // Get existing achievements
    const { data: existingAchievements } = await supabase
      .from("achievements")
      .select("type")
      .eq("user_id", userId);

    const earnedTypes = new Set(existingAchievements?.map((a) => a.type) || []);

    // Check each achievement definition
    for (const achievement of ACHIEVEMENTS) {
      // Get current progress value
      const currentValue = getProgressValue(
        achievement.requirement,
        progressData,
      );

      // Check if user meets threshold but doesn't have the achievement
      if (
        currentValue >= achievement.threshold &&
        !earnedTypes.has(achievement.id)
      ) {
        // Award the missing achievement
        const { error } = await supabase.from("achievements").insert({
          user_id: userId,
          type: achievement.id,
          value: 1,
        });

        if (!error) {
          newAchievements.push(achievement.id);
          earnedTypes.add(achievement.id);
        } else {
          console.error(`Error awarding achievement ${achievement.id}:`, error);
        }
      }
    }
  } catch (err) {
    console.error("Error syncing missing achievements:", err);
  }

  return newAchievements;
}

// User progress data interface
export interface UserProgressData {
  totalReceipts: number;
  totalSpent: number;
  uniqueCategories: number;
  budgetsCreated: number;
  streak: number;
  greenLeaves: number;
}

// Fetch user progress data for achievement badges
export async function fetchUserProgressData(
  userId: string,
): Promise<UserProgressData> {
  const defaultProgress: UserProgressData = {
    totalReceipts: 0,
    totalSpent: 0,
    uniqueCategories: 0,
    budgetsCreated: 0,
    streak: 0,
    greenLeaves: 0,
  };

  try {
    // Get receipt count
    const { count: totalReceipts } = await supabase
      .from("receipts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get receipts for streak calculation
    const { data: receipts } = await supabase
      .from("receipts")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    // Calculate streak
    let streak = 0;
    if (receipts && receipts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const receiptDates = new Set(receipts.map((r) => r.date));

      for (let i = 0; ; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        if (receiptDates.has(checkDate.toISOString().split("T")[0])) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Get unique categories and spending from items
    const { data: items } = await supabase
      .from("items")
      .select("category, price")
      .eq("user_id", userId);

    const uniqueCategories = new Set(
      items?.map((i) => i.category).filter(Boolean) || [],
    ).size;

    const totalSpent =
      items?.reduce((sum, item) => {
        const price =
          typeof item.price === "number"
            ? item.price
            : parseFloat(String(item.price).replace(",", "."));
        return sum + (price || 0);
      }, 0) || 0;

    // Get budgets count
    const { count: budgetsCreated } = await supabase
      .from("budgets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get green leaves from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("green_leaves_count")
      .eq("id", userId)
      .single();

    return {
      totalReceipts: totalReceipts || 0,
      totalSpent,
      uniqueCategories,
      budgetsCreated: budgetsCreated || 0,
      streak,
      greenLeaves: profile?.green_leaves_count || 0,
    };
  } catch (err) {
    console.error("Error fetching user progress:", err);
    return defaultProgress;
  }
}

// Get progress value for a specific achievement requirement
export function getProgressValue(
  requirement: string,
  progressData: UserProgressData,
): number {
  switch (requirement) {
    case "total_receipts":
      return progressData.totalReceipts;
    case "total_spent":
      return progressData.totalSpent;
    case "unique_categories":
      return progressData.uniqueCategories;
    case "budgets_created":
      return progressData.budgetsCreated;
    case "streak_7_days":
    case "streak_30_days":
      return progressData.streak;
    case "green_leaves_count":
      return progressData.greenLeaves;
    case "first_receipt":
      return progressData.totalReceipts;
    default:
      return 0;
  }
}
