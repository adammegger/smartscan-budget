import {
  Camera,
  Calendar,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  Wallet,
  Trophy,
  Receipt,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { ThemeProvider, useTheme } from "./lib/theme";
import Scanner from "./components/Scanner";
import Receipts from "./components/Receipts";
import DashboardTiles from "./components/DashboardTiles";
import ProductPriceHistory from "./components/ProductPriceHistory";
import Login from "./components/Login";
import Register from "./components/Register";
import Budgets from "./components/Budgets";
import Achievements from "./components/Achievements";

// Theme Toggle Button Component
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    console.log(
      "Current theme:",
      theme,
      "-> switching to:",
      theme === "dark" ? "light" : "dark",
    );
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      {theme === "dark" ? "Jasny" : "Ciemny"}
    </button>
  );
}

// Main App Content
function AppContent() {
  const [supabaseStatus, setSupabaseStatus] = useState<
    "loading" | "connected" | "error"
  >("loading");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setUserEmail] = useState<string>("");
  const [captureMessage, setCaptureMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(
    null,
  );
  const [dateFilter, setDateFilter] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    period: "today" | "week" | "month" | "custom";
  }>({
    startDate: (() => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return thirtyDaysAgo;
    })(),
    endDate: new Date(),
    period: "custom",
  });
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "receipts" | "priceHistory" | "budgets" | "achievements"
  >("dashboard");
  const [isDateFilterExpanded, setIsDateFilterExpanded] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<
    string | null
  >(null);
  const scannerRef = useRef<React.ElementRef<typeof Scanner>>(null);

  // Handle clicking on a product name - navigate to price history
  const handleProductClick = (productName: string) => {
    setSelectedProductForHistory(productName);
    setActiveTab("priceHistory");
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail("");
  };

  const handleImageCaptured = (imageData: string | Blob) => {
    setCaptureMessage("Paragon uchwycony! Przygotowuję do analizy…");
    setIsAnalyzing(true);

    // Hide the message after 3 seconds
    setTimeout(() => {
      setCaptureMessage("");
    }, 3000);

    console.log("Image captured:", imageData);
  };

  const handleAnalysisComplete = (receiptData: unknown) => {
    setIsAnalyzing(false);
    setCaptureMessage("Paragon zapisany pomyślnie!");

    // Hide success message after 3 seconds
    setTimeout(() => {
      setCaptureMessage("");
    }, 3000);

    console.log("Receipt analysis complete:", receiptData);
  };

  const handleAnalysisError = (error: string) => {
    setIsAnalyzing(false);
    setCaptureMessage(`Błąd: ${error}`);

    // Hide error message after 5 seconds
    setTimeout(() => {
      setCaptureMessage("");
    }, 5000);

    console.error("Analysis error:", error);
  };

  const triggerScan = () => {
    scannerRef.current?.triggerCamera();
  };

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Supabase connection error:", error);
          setSupabaseStatus("error");
        } else {
          console.log("Supabase connected successfully:", data);
          setSupabaseStatus("connected");
        }
      } catch (error) {
        console.error("Supabase connection failed:", error);
        setSupabaseStatus("error");
      }
    };

    checkSupabaseConnection();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
      } else {
        setIsAuthenticated(false);
        setUserEmail("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Check current path for auth-protected routes
  const currentPath = window.location.pathname;

  // For /login and /register routes, always show the respective components
  if (currentPath === "/login" || currentPath === "/register") {
    if (currentPath === "/register") {
      return (
        <Register onRegisterSuccess={() => (window.location.href = "/login")} />
      );
    }
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // For other routes, require authentication
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-12">
      {/* Header */}
      <header className="px-6 lg:px-12 xl:px-16 2xl:px-24 py-8">
        <div className="flex justify-between items-center">
          {/* Logo and App Name */}
          <div className="flex items-center gap-3">
            <img src="/logo-1.svg" alt="Paragonly" className="h-12 w-auto" />
            <div>
              <h1
                className="text-2xl font-bold text-orange-500"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Paragonly
              </h1>
              <p className="text-xs text-muted-foreground">Twoje finanse</p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  supabaseStatus === "connected"
                    ? "bg-green-500"
                    : supabaseStatus === "error"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {supabaseStatus === "connected"
                  ? "Supabase połączony"
                  : supabaseStatus === "error"
                    ? "Błąd połączenia"
                    : "Łączenie..."}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <LogOut size={16} />
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      {/* Scan Button */}
      <section className="px-6 lg:px-12 xl:px-16 2xl:px-24 py-8">
        <div className="flex flex-col items-center">
          <button
            onClick={triggerScan}
            disabled={isAnalyzing}
            className={`bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-primary-foreground font-bold p-6 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-300 flex items-center justify-center ${
              isAnalyzing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isAnalyzing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground"></div>
            ) : (
              <Camera size={32} />
            )}
          </button>
          <span className="mt-4 text-lg font-semibold text-muted-foreground">
            {isAnalyzing ? "ANALIZUJĘ..." : "SKANUJ PARAGON"}
          </span>

          {/* DEV ONLY - Mock Scan Button */}
          <button
            onClick={() => scannerRef.current?.triggerMockScan()}
            disabled={isAnalyzing}
            className="mt-4 px-4 py-2 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-600 dark:text-yellow-400 rounded-lg border border-yellow-500/30 transition-colors"
          >
            🔧 DEV: Symuluj skanowanie
          </button>
        </div>

        {/* Capture Message */}
        {captureMessage && (
          <div className="mt-4 text-center">
            <p
              className={`font-semibold ${
                captureMessage.includes("Błąd")
                  ? "text-destructive"
                  : captureMessage.includes("pomyślnie")
                    ? "text-green-600 dark:text-green-400"
                    : "text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {captureMessage}
            </p>
          </div>
        )}
      </section>

      {/* Navigation Tabs */}
      <nav className="px-6 lg:px-12 xl:px-16 2xl:px-24 pb-6">
        <div className="bg-card border border-border rounded-xl">
          <div className="flex flex-wrap">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 font-semibold transition-colors ${
                activeTab === "dashboard"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Calendar size={20} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("receipts")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 font-semibold transition-colors ${
                activeTab === "receipts"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Receipt size={20} />
              Paragony
            </button>
            <button
              onClick={() => setActiveTab("budgets")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 font-semibold transition-colors ${
                activeTab === "budgets"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Wallet size={20} />
              Budżety
            </button>
            <button
              onClick={() => setActiveTab("priceHistory")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 font-semibold transition-colors ${
                activeTab === "priceHistory"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <BarChart3 size={20} />
              Historia cen
            </button>
            <button
              onClick={() => setActiveTab("achievements")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 font-semibold transition-colors ${
                activeTab === "achievements"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Trophy size={20} />
              Osiągnięcia
            </button>
          </div>
        </div>
      </nav>

      {/* Date Filter Section - only show for dashboard and receipts tabs */}
      {(activeTab === "dashboard" || activeTab === "receipts") && (
        <section className="px-6 lg:px-12 xl:px-16 2xl:px-24 pb-6">
          <div className="bg-card border border-border rounded-xl">
            <button
              onClick={() => setIsDateFilterExpanded(!isDateFilterExpanded)}
              className="w-full flex items-center justify-between p-6 hover:bg-muted transition-colors"
            >
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar size={20} />
                Filtr dat
              </h3>
              <svg
                className={`w-4 h-4 transition-transform ${
                  isDateFilterExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                isDateFilterExpanded
                  ? "max-h-96 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-6 border-t border-border">
                {/* Quick Period Buttons - Badge Style */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { key: "today", label: "Dziś", color: "#86efac" }, // Pastel Green
                    { key: "week", label: "Tydzień", color: "#93c5fd" }, // Pastel Blue
                    { key: "month", label: "Miesiąc", color: "#fde047" }, // Pastel Yellow
                    {
                      key: "last30",
                      label: "Ostatnie 30 dni",
                      color: "#c084fc",
                    }, // Pastel Purple
                    {
                      key: "custom",
                      label: "Niestandardowy",
                      color: "#f472b6",
                    }, // Pastel Pink
                  ].map((period) => {
                    // Calculate dates for each period - simplified to use actual date ranges
                    const getDatesForPeriod = () => {
                      const today = new Date();
                      // Set to end of day
                      today.setHours(23, 59, 59, 999);

                      if (period.key === "today") {
                        const startOfDay = new Date(today);
                        startOfDay.setHours(0, 0, 0, 0);
                        return { startDate: startOfDay, endDate: today };
                      }
                      if (period.key === "week") {
                        // Last 7 days - simple calculation
                        const sevenDaysAgo = new Date(today);
                        sevenDaysAgo.setDate(today.getDate() - 7);
                        sevenDaysAgo.setHours(0, 0, 0, 0);
                        return { startDate: sevenDaysAgo, endDate: today };
                      }
                      if (period.key === "month") {
                        // Last 30 days - simpler approach
                        const thirtyDaysAgo = new Date(today);
                        thirtyDaysAgo.setDate(today.getDate() - 30);
                        thirtyDaysAgo.setHours(0, 0, 0, 0);
                        return { startDate: thirtyDaysAgo, endDate: today };
                      }
                      if (period.key === "last30") {
                        const thirtyDaysAgo = new Date(today);
                        thirtyDaysAgo.setDate(today.getDate() - 30);
                        thirtyDaysAgo.setHours(0, 0, 0, 0);
                        return { startDate: thirtyDaysAgo, endDate: today };
                      }
                      return { startDate: null, endDate: null };
                    };

                    const dates = getDatesForPeriod();
                    const isActive = dateFilter.period === period.key;

                    return (
                      <button
                        key={period.key}
                        onClick={() => {
                          if (period.key === "custom") {
                            setDateFilter({
                              ...dateFilter,
                              period: "custom",
                              startDate: null,
                              endDate: null,
                            });
                          } else {
                            setDateFilter({
                              ...dateFilter,
                              period: period.key as
                                | "today"
                                | "week"
                                | "month"
                                | "custom",
                              startDate: dates.startDate,
                              endDate: dates.endDate,
                            });
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "font-bold border-2"
                            : "bg-[#1a1a1a] text-muted-foreground border-2"
                        }`}
                        style={{
                          backgroundColor: "transparent",
                          borderColor: period.color,
                          color: period.color,
                          boxShadow: isActive
                            ? `0 0 15px ${period.color}40`
                            : "none",
                          cursor: "pointer",
                        }}
                      >
                        {period.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Date Range */}
                {dateFilter.period === "custom" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Data początkowa
                      </label>
                      <input
                        type="date"
                        value={
                          dateFilter.startDate
                            ? dateFilter.startDate.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) => {
                          const date = e.target.value
                            ? new Date(e.target.value)
                            : null;
                          setDateFilter({
                            ...dateFilter,
                            startDate: date,
                          });
                        }}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Data końcowa
                      </label>
                      <input
                        type="date"
                        value={
                          dateFilter.endDate
                            ? dateFilter.endDate.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) => {
                          const date = e.target.value
                            ? new Date(e.target.value)
                            : null;
                          setDateFilter({
                            ...dateFilter,
                            endDate: date,
                          });
                        }}
                        className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="px-6 lg:px-12 xl:px-16 2xl:px-24 pb-8">
        {activeTab === "dashboard" ? (
          <DashboardTiles dateFilter={dateFilter} />
        ) : activeTab === "receipts" ? (
          <Receipts
            selectedReceiptId={selectedReceiptId}
            onReceiptSelect={setSelectedReceiptId}
            onProductClick={handleProductClick}
            dateFilter={dateFilter}
          />
        ) : activeTab === "budgets" ? (
          <Budgets dateFilter={dateFilter} />
        ) : activeTab === "achievements" ? (
          <Achievements />
        ) : (
          <ProductPriceHistory initialProduct={selectedProductForHistory} />
        )}
      </section>

      {/* Hidden Scanner Component */}
      <Scanner
        ref={scannerRef}
        onImageCaptured={handleImageCaptured}
        onAnalysisComplete={handleAnalysisComplete}
        onAnalysisError={handleAnalysisError}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
