import type {
  ReceiptCache,
  BudgetCache,
  FavoriteProductCache,
} from "./dataCache";
import { useContext } from "react";
import { DataCacheContext } from "./dataCacheContext";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper hook to check if cache is still valid
export function useCacheValid(
  cache: ReceiptCache | BudgetCache | FavoriteProductCache | null,
  duration: number = CACHE_DURATION,
) {
  if (!cache) return false;
  return Date.now() - cache.lastFetched < duration;
}

// Export refresh functions for direct use
export const refreshAllDataDirect = async () => {
  const { refreshReceipts, refreshBudgets, refreshFavoriteProducts } =
    await import("./dataRefresh");
  await Promise.all([
    refreshReceipts(),
    refreshBudgets(),
    refreshFavoriteProducts(),
  ]);
};

// Hook to access data cache context
export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error("useDataCache must be used within a DataCacheProvider");
  }
  return context;
}
