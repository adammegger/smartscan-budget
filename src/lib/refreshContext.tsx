import { createContext, useContext, useState } from "react";

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

// Provider component
export const RefreshProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};
