import React, { createContext, useContext, useState, useCallback } from "react";

interface ScanningContextType {
  isScanning: boolean;
  setIsScanning: (isScanning: boolean) => void;
  startScanning: () => void;
  stopScanning: () => void;
}

const ScanningContext = createContext<ScanningContextType | undefined>(
  undefined,
);

export const useScanning = () => {
  const context = useContext(ScanningContext);
  if (!context) {
    throw new Error("useScanning must be used within a ScanningProvider");
  }
  return context;
};

interface ScanningProviderProps {
  children: React.ReactNode;
}

export const ScanningProvider: React.FC<ScanningProviderProps> = ({
  children,
}) => {
  const [isScanning, setIsScanning] = useState(false);

  const startScanning = useCallback(() => {
    setIsScanning(true);
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
  }, []);

  const value = {
    isScanning,
    setIsScanning,
    startScanning,
    stopScanning,
  };

  return (
    <ScanningContext.Provider value={value}>
      {children}
    </ScanningContext.Provider>
  );
};
