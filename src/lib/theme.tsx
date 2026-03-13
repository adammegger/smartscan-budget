import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Store for external subscription - uses getter to always get current value
const themeStore = {
  _theme: "dark" as Theme,
  listeners: new Set<() => void>(),

  get theme() {
    return this._theme;
  },

  getSnapshot() {
    return this._theme;
  },

  getServerSnapshot() {
    return "dark" as Theme;
  },

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  setTheme(theme: Theme) {
    this._theme = theme;
    localStorage.setItem("theme", theme);

    // Remove all theme classes first
    document.documentElement.classList.remove("light", "dark");
    // Add the appropriate class
    document.documentElement.classList.add(theme);

    this.listeners.forEach((listener) => listener());
  },

  toggleTheme() {
    const newTheme = this._theme === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
  },

  init() {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || "dark";
    this.setTheme(initialTheme);
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    themeStore.subscribe.bind(themeStore),
    themeStore.getSnapshot.bind(themeStore),
    themeStore.getServerSnapshot.bind(themeStore),
  );

  useEffect(() => {
    // Initialize theme on mount
    if (typeof window !== "undefined") {
      themeStore.init();
    }
  }, []);

  const toggleTheme = () => {
    themeStore.toggleTheme();
  };

  const setTheme = (newTheme: Theme) => {
    themeStore.setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
