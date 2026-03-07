import { createContext } from "react";
import type {
  ReceiptCache,
  BudgetCache,
  FavoriteProductCache,
} from "./dataCache";
import type { Profile } from "./profile";

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

export const DataCacheContext = createContext<DataCacheContextType | null>(
  null,
);
