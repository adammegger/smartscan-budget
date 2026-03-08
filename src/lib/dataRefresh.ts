import { supabase } from "./supabase";
import type { Receipt, Budget, Category, FavoriteProduct } from "./types";

// Types for cached data
interface ReceiptCache {
  receipts: Receipt[];
  itemCounts: Record<number, number>;
  lastFetched: number;
}

interface BudgetCache {
  budgets: Budget[];
  categories: Category[];
  lastFetched: number;
}

interface FavoriteProductCache {
  products: FavoriteProduct[];
  lastFetched: number;
}

// Refresh functions for mutations
export const refreshReceipts = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: receipts } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    const receiptIds = receipts?.map((r) => r.id) || [];
    const { data: items } = await supabase
      .from("items")
      .select("receipt_id")
      .eq("user_id", user.id)
      .in("receipt_id", receiptIds);

    const itemCounts: Record<number, number> = {};
    items?.forEach((item) => {
      itemCounts[item.receipt_id] = (itemCounts[item.receipt_id] || 0) + 1;
    });

    return {
      receipts: receipts || [],
      itemCounts,
      lastFetched: Date.now(),
    } as ReceiptCache;
  } catch (error) {
    console.error("Error refreshing receipts:", error);
    throw error;
  }
};

export const refreshBudgets = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [budgetsRes, categoriesRes] = await Promise.all([
      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order("name", { ascending: true }),
    ]);

    return {
      budgets: budgetsRes.data || [],
      categories: categoriesRes.data || [],
      lastFetched: Date.now(),
    } as BudgetCache;
  } catch (error) {
    console.error("Error refreshing budgets:", error);
    throw error;
  }
};

export const refreshFavoriteProducts = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // SAFE FALLBACK - Table doesn't exist, return empty array immediately
    // DANGEROUS - CRASHES APP
    // const { data: products } = await supabase.from('favorite_products').select('*');

    // SAFE FALLBACK (REPLACE WITH THIS)
    const data: unknown[] = []; // Mock empty response because table doesn't exist

    return {
      products: data || [],
      lastFetched: Date.now(),
    } as FavoriteProductCache;
  } catch (error) {
    console.error("Error refreshing favorite products:", error);
    throw error;
  }
};

export const refreshAllData = async () => {
  await Promise.all([
    refreshReceipts(),
    refreshBudgets(),
    refreshFavoriteProducts(),
  ]);
};
