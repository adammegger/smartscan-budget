import { createContext, useContext } from "react";

// Context for sharing refresh functionality
export const RefreshContext = createContext<{
  refreshKey: number;
  triggerRefresh: () => void;
} | null>(null);

// Hook to use the refresh context
export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
};
