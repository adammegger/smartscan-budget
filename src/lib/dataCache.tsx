import { useState, useCallback, type ReactNode } from "react";
import type { BudgetWithSpending, Category, Receipt } from "./types";
import {
  refreshReceipts,
  refreshBudgets,
  refreshFavoriteProducts,
} from "./dataRefresh";
import { DataCacheContext } from "./dataCacheContext";
import { ensureUserProfile, type Profile } from "./profile";

// Types for cached data
export interface ReceiptCache {
  receipts: Receipt[];
  itemCounts: Record<number, number>;
  lastFetched: number;
}

export interface BudgetCache {
  budgets: BudgetWithSpending[];
  categories: Category[];
  lastFetched: number;
}

export interface FavoriteProductLocal {
  id: string;
  name: string;
  category: string;
  category_id: string | null;
  count: number;
  totalSpent: number;
  avgPrice: number;
  lastPurchased: Date;
}

export interface FavoriteProductCache {
  products: FavoriteProductLocal[];
  lastFetched: number;
}

interface DataCacheContextType {
  // Receipts cache
  receiptCache: ReceiptCache | null;
  setReceiptCache: (data: ReceiptCache) => void;
  clearReceiptCache: () => void;

  // Budgets cache
  budgetCache: BudgetCache | null;
  setBudgetCache: (data: BudgetCache) => void;
  clearBudgetCache: () => void;

  // Favorite products cache
  favoriteProductCache: FavoriteProductCache | null;
  setFavoriteProductCache: (data: FavoriteProductCache) => void;
  clearFavoriteProductCache: () => void;

  // User profile
  userProfile: Profile | null;
  setUserProfile: (profile: Profile) => void;
  clearUserProfile: () => void;

  // Refresh functions
  refreshReceipts: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
  refreshFavoriteProducts: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [receiptCache, setReceiptCacheState] = useState<ReceiptCache | null>(
    null,
  );
  const [budgetCache, setBudgetCacheState] = useState<BudgetCache | null>(null);
  const [favoriteProductCache, setFavoriteProductCacheState] =
    useState<FavoriteProductCache | null>(null);
  const [userProfile, setUserProfileState] = useState<Profile | null>(null);

  const setReceiptCache = useCallback((data: ReceiptCache) => {
    setReceiptCacheState(data);
  }, []);

  const setBudgetCache = useCallback((data: BudgetCache) => {
    setBudgetCacheState(data);
  }, []);

  const setFavoriteProductCache = useCallback((data: FavoriteProductCache) => {
    setFavoriteProductCacheState(data);
  }, []);

  const setUserProfile = useCallback((profile: Profile) => {
    setUserProfileState(profile);
  }, []);

  const clearUserProfile = useCallback(() => {
    setUserProfileState(null);
  }, []);

  const clearReceiptCache = useCallback(() => {
    setReceiptCacheState(null);
  }, []);

  const clearBudgetCache = useCallback(() => {
    setBudgetCacheState(null);
  }, []);

  const clearFavoriteProductCache = useCallback(() => {
    setFavoriteProductCacheState(null);
  }, []);

  // Refresh functions for mutations
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      refreshReceipts(),
      refreshBudgets(),
      refreshFavoriteProducts(),
    ]);
  }, [refreshReceipts, refreshBudgets, refreshFavoriteProducts]);

  // Wrap imported refresh functions to match context interface
  const wrappedRefreshReceipts = useCallback(async () => {
    await refreshReceipts();
  }, []);

  const wrappedRefreshBudgets = useCallback(async () => {
    await refreshBudgets();
  }, []);

  const wrappedRefreshFavoriteProducts = useCallback(async () => {
    await refreshFavoriteProducts();
  }, []);

  const value: DataCacheContextType = {
    // Receipts
    receiptCache,
    setReceiptCache,
    clearReceiptCache,
    refreshReceipts: wrappedRefreshReceipts,

    // Budgets
    budgetCache,
    setBudgetCache,
    clearBudgetCache,
    refreshBudgets: wrappedRefreshBudgets,

    // Favorite products
    favoriteProductCache,
    setFavoriteProductCache,
    clearFavoriteProductCache,
    refreshFavoriteProducts: wrappedRefreshFavoriteProducts,

    // User profile
    userProfile,
    setUserProfile,
    clearUserProfile,
    refreshUserProfile: async () => {
      const profile = await ensureUserProfile();
      if (profile) {
        setUserProfileState(profile);
      }
    },

    refreshAllData,
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
}
