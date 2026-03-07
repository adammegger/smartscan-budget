import { createContext } from "react";
import type {
  ReceiptCache,
  BudgetCache,
  FavoriteProductCache,
} from "./dataCache";

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

  // Refresh functions
  refreshReceipts: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
  refreshFavoriteProducts: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

export const DataCacheContext = createContext<DataCacheContextType | null>(
  null,
);
