import {
  Camera,
  Calendar,
  BarChart3,
  LogOut,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { ThemeProvider, useTheme } from "./lib/theme";
import Scanner from "./components/Scanner";
import Receipts from "./components/Receipts";
import CategorySummary from "./components/CategorySummary";
import ProductPriceHistory from "./components/ProductPriceHistory";
import Login from "./components/Login";

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
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors"
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
  const [userEmail, setUserEmail] = useState<string>("");
  const [captureMessage, setCaptureMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(
    null,
  );
  const [dateFilter, setDateFilter] = useState({
    startDate: (() => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek;
    })(),
    endDate: new Date(),
    period: "week" as "today" | "week" | "month" | "custom",
  });
  const [activeTab, setActiveTab] = useState<"receipts" | "priceHistory">(
    "receipts",
  );
  const [isDateFilterExpanded, setIsDateFilterExpanded] = useState(false);
  const scannerRef = useRef<React.ElementRef<typeof Scanner>>(null);

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
        // Try to get the current session to test the connection
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

  // Check authentication status on mount and set up auth listener
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

    // Listen for auth changes
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
      <div className="min-h-screen bg-zinc-950 dark:bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 dark:bg-background text-foreground pt-12 px-4">
      {/* Header */}
      <header className="px-6 py-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User size={20} className="text-gray-400" />
            <span className="text-sm text-gray-300">{userEmail}</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  supabaseStatus === "connected"
                    ? "bg-green-400"
                    : supabaseStatus === "error"
                      ? "bg-red-400"
                      : "bg-yellow-400"
                }`}
              />
              <span className="text-sm text-gray-400">
                {supabaseStatus === "connected"
                  ? "Supabase połączony"
                  : supabaseStatus === "error"
                    ? "Błąd połączenia"
                    : "Łączenie..."}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-colors"
            >
              <LogOut size={16} />
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      {/* Scan Button */}
      <section className="px-6 py-8">
        <div className="flex flex-col items-center">
          <button
            onClick={triggerScan}
            disabled={isAnalyzing}
            className={`bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold p-6 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-300 flex items-center justify-center ${
              isAnalyzing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isAnalyzing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <Camera size={32} />
            )}
          </button>
          <span className="mt-4 text-lg font-semibold text-gray-300">
            {isAnalyzing ? "ANALIZUJĘ..." : "SKANUJ PARAGON"}
          </span>
        </div>

        {/* Capture Message */}
        {captureMessage && (
          <div className="mt-4 text-center">
            <p
              className={`font-semibold ${
                captureMessage.includes("Błąd")
                  ? "text-red-400"
                  : captureMessage.includes("pomyślnie")
                    ? "text-green-400"
                    : "text-yellow-400"
              }`}
            >
              {captureMessage}
            </p>
          </div>
        )}
      </section>

      {/* Navigation Tabs */}
      <nav className="px-6 pb-6">
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl backdrop-blur-sm">
          <div className="flex">
            <button
              onClick={() => setActiveTab("receipts")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 font-semibold transition-colors ${
                activeTab === "receipts"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <Calendar size={20} />
              Paragony
            </button>
            <button
              onClick={() => setActiveTab("priceHistory")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 font-semibold transition-colors ${
                activeTab === "priceHistory"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <BarChart3 size={20} />
              Historia cen
            </button>
          </div>
        </div>
      </nav>

      {/* Date Filter Section - only show for receipts tab */}
      {activeTab === "receipts" && (
        <section className="px-6 pb-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl backdrop-blur-sm">
            <button
              onClick={() => setIsDateFilterExpanded(!isDateFilterExpanded)}
              className="w-full flex items-center justify-between p-6 hover:bg-zinc-800/50 transition-colors"
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
              <div className="p-6 border-t border-zinc-700/50">
                {/* Quick Period Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { key: "today", label: "Dziś" },
                    { key: "week", label: "Tydzień" },
                    { key: "month", label: "Miesiąc" },
                    { key: "custom", label: "Niestandardowy" },
                  ].map((period) => (
                    <button
                      key={period.key}
                      onClick={() =>
                        setDateFilter({
                          ...dateFilter,
                          period: period.key as
                            | "today"
                            | "week"
                            | "month"
                            | "custom",
                          startDate:
                            period.key === "custom"
                              ? null
                              : (() => {
                                  const today = new Date();
                                  const startOfWeek = new Date(today);
                                  startOfWeek.setDate(
                                    today.getDate() - today.getDay(),
                                  );
                                  startOfWeek.setHours(0, 0, 0, 0);
                                  return startOfWeek;
                                })(),
                          endDate: period.key === "custom" ? null : new Date(),
                        })
                      }
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 border border-zinc-700/50 ${
                        dateFilter.period === period.key
                          ? "bg-zinc-800 text-white hover:bg-zinc-700"
                          : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-white"
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range */}
                {dateFilter.period === "custom" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
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
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-zinc-600/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
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
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-zinc-600/50"
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
      <section className="px-6 pb-8">
        {activeTab === "receipts" ? (
          <>
            <Receipts
              selectedReceiptId={selectedReceiptId}
              onReceiptSelect={setSelectedReceiptId}
              dateFilter={dateFilter}
            />
            <div className="mt-8">
              <CategorySummary dateFilter={dateFilter} />
            </div>
          </>
        ) : (
          <ProductPriceHistory />
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
