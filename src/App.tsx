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
  ShoppingCart,
} from "lucide-react";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { supabase } from "./lib/supabase";
import { ThemeProvider, useTheme } from "./lib/theme";
import { Routes, Route, Link, useNavigate, Outlet } from "react-router-dom";
import Scanner from "./components/Scanner";
import Receipts from "./components/Receipts";
import DashboardTiles from "./components/DashboardTiles";
import ProductPriceHistory from "./components/ProductPriceHistory";
import FavoriteProducts from "./pages/dashboard/FavoriteProducts";
import Login from "./components/Login";
import Register from "./components/Register";
import ResetPassword from "./components/ResetPassword";
import UpdatePassword from "./components/UpdatePassword";
import Budgets from "./components/Budgets";
import Achievements from "./components/Achievements";
import ReceiptVerification from "./components/ReceiptVerification";
import Profile from "./components/Profile";
import { TooltipProvider } from "./components/ui/tooltip";
import { saveReceiptToSupabase } from "./lib/receiptVerification";
import { DataCacheProvider } from "./lib/dataCache";
import { preloadCategories } from "./lib/categoryCache";
import Logo from "./components/Logo";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import Faq from "./pages/Faq";
import LandingPage from "./pages/LandingPage";
import Success from "./pages/Success";
import ScrollToTop from "./components/ScrollToTop";
import { useDataCache } from "./lib/cacheUtils";
import { RefreshContext, useRefresh } from "./lib/refreshContext";

// Import the correct ReceiptData type from receiptVerification
import type { ReceiptData } from "./lib/receiptVerification";

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
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      {theme === "dark" ? "Jasny" : "Ciemny"}
    </button>
  );
}

// Dashboard Layout Component
function DashboardLayout() {
  const navigate = useNavigate();
  // const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setUserEmail] = useState<string>("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [captureMessage, setCaptureMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verificationReceipt, setVerificationReceipt] =
    useState<ReceiptData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const scannerRef = useRef<React.ElementRef<typeof Scanner>>(null);

  // Data cache for user profile
  const { setUserProfile, refreshUserProfile, userProfile } = useDataCache();

  // Refresh context value
  const refreshContextValue = {
    refreshKey,
    triggerRefresh: () => setRefreshKey((prev) => prev + 1),
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail("");
    // Redirect to home page after logout using client-side routing
    navigate("/");
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

  const handleAnalysisComplete = (receiptData: ReceiptData) => {
    setIsAnalyzing(false);
    setCaptureMessage("Zweryfikuj dane z paragonu...");

    // ZAPISUJEMY DANE DO STANU, ŻEBY WYŚWIETLIĆ MODAL:
    setVerificationReceipt(receiptData);
    console.log("Oczekuje na weryfikację:", receiptData);
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
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setIsAuthenticated(true);
          setUserEmail(session.user.email || "");
          // Fetch and store user profile with subscription_tier
          await refreshUserProfile();
          // Preload categories when user logs in
          await preloadCategories();
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Don't throw - just log and continue
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event, session);

      // Handle refresh token errors gracefully
      if (event === "SIGNED_IN" && session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
        // Fetch and store user profile with subscription_tier
        refreshUserProfile();
        // Preload categories when user logs in
        preloadCategories();
      } else if (event === "SIGNED_OUT" || !session) {
        setIsAuthenticated(false);
        setUserEmail("");
      } else if (event === "TOKEN_REFRESHED" && session) {
        // Token refresh successful
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
        // Fetch and store user profile with subscription_tier
        refreshUserProfile();
      } else if (event === "INITIAL_SESSION" && session) {
        // Initial session loaded
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
        // Fetch and store user profile with subscription_tier
        refreshUserProfile();
        // Preload categories when initial session is loaded
        preloadCategories();
      } else if (event === "PASSWORD_RECOVERY") {
        // Password recovery event - don't change auth state
        console.log("Password recovery event");
      } else if (event === "USER_UPDATED") {
        // User updated - refresh session data and profile
        if (session) {
          setUserEmail(session.user.email || "");
          // Fetch and store user profile with subscription_tier
          refreshUserProfile();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Remove refreshUserProfile from dependencies to prevent infinite loop

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

  // For /login, /register, /reset-password, and /update-password routes, always show the respective components
  if (
    currentPath === "/login" ||
    currentPath === "/register" ||
    currentPath === "/reset-password" ||
    currentPath === "/update-password"
  ) {
    if (currentPath === "/register") {
      return <Register onRegisterSuccess={() => navigate("/login")} />;
    }
    if (currentPath === "/reset-password") {
      return <ResetPassword onResetSuccess={() => navigate("/login")} />;
    }
    if (currentPath === "/update-password") {
      return <UpdatePassword />;
    }
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // For root path (/), show Landing Page if not authenticated
  if (currentPath === "/" && !isAuthenticated) {
    // Import and render Landing Page
    const LandingPage = lazy(() => import("./pages/LandingPage"));
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <LandingPage />
      </Suspense>
    );
  }

  // For informational pages, show them regardless of authentication
  if (currentPath === "/regulamin") {
    return <Terms />;
  }
  if (currentPath === "/polityka-prywatnosci") {
    return <Privacy />;
  }
  if (currentPath === "/kontakt") {
    return <Contact />;
  }
  if (currentPath === "/faq") {
    return <Faq />;
  }

  // For other routes, require authentication
  if (!isAuthenticated) {
    // If we're in the process of logging out, show a blank screen to prevent flicker
    if (isLoggingOut) {
      return <div className="min-h-screen bg-background" />;
    }

    return (
      <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-md w-full">
          {authMode === "login" ? (
            <Login onLoginSuccess={handleLoginSuccess} />
          ) : (
            <Register onRegisterSuccess={() => setAuthMode("login")} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-12">
      {/* Header */}
      <header className="px-6 lg:px-12 xl:px-16 2xl:px-24 py-8">
        <div className="flex justify-between items-center">
          {/* Logo and App Name */}
          <div className="flex items-center gap-2">
            <Logo className="h-12 w-auto" />
            <span
              className="font-bold tracking-wider"
              style={{
                fontFamily:
                  "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif",
                fontSize: "1.25rem",
                fontWeight: "700",
              }}
            >
              PARAGONLY
            </span>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-6">
            {/* Greeting */}
            <div className="text-right">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {userProfile?.first_name
                    ? `Cześć, ${userProfile.first_name}!`
                    : "Cześć, użytkowniku!"}
                </p>
                {/* Subscription Tier Badge */}
                <span
                  className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                    userProfile?.subscription_tier === "pro"
                      ? "bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {userProfile?.subscription_tier === "pro" ? (
                    <span className="flex items-center gap-1">✨ PRO</span>
                  ) : (
                    "FREE"
                  )}
                </span>
              </div>
            </div>

            <ThemeToggle />
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Profil
            </Link>
            {/* Subscription Tier Badge */}
            {/* <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span className="text-orange-600 dark:text-orange-400">
                {userProfile?.subscription_tier?.toUpperCase() || "FREE"}
              </span>
            </div> */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
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
            className={`cursor-pointer bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-primary-foreground font-bold p-6 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-300 flex items-center justify-center ${
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
        {/* Kontener tylko z ramką, zero paddingu, twarde cięcie */}
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
          <div className="flex">
            {[
              {
                id: "dashboard",
                path: "/dashboard",
                icon: <Calendar size={20} />,
                label: "Dashboard",
              },
              {
                id: "receipts",
                path: "/dashboard/receipts",
                icon: <Receipt size={20} />,
                label: "Paragony",
              },
              {
                id: "budgets",
                path: "/dashboard/budgets",
                icon: <Wallet size={20} />,
                label: "Budżety",
              },
              {
                id: "priceHistory",
                path: "/dashboard/price-history",
                icon: <BarChart3 size={20} />,
                label: "Historia cen",
              },
              {
                id: "favoriteProducts",
                path: "/dashboard/favorite-products",
                icon: <ShoppingCart size={20} />,
                label: "Ulubione produkty",
              },
              {
                id: "achievements",
                path: "/dashboard/achievements",
                icon: <Trophy size={20} />,
                label: "Osiągnięcia",
              },
            ].map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className="cursor-pointer flex-1 flex items-center justify-center gap-2 p-4 font-semibold transition-all duration-200 outline-none ring-0 border-none bg-transparent"
                style={{
                  // Ten styl wymusza tło i tekst tylko na podstawie aktualnej ścieżki
                  backgroundColor:
                    window.location.pathname === tab.path
                      ? "var(--secondary)"
                      : "transparent",
                  color:
                    window.location.pathname === tab.path
                      ? "var(--secondary-foreground)"
                      : "var(--muted-foreground)",
                  borderRadius: "0px",
                }}
                onMouseEnter={(e) => {
                  if (window.location.pathname !== tab.path) {
                    e.currentTarget.style.backgroundColor = "var(--muted)";
                    e.currentTarget.style.color = "var(--foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.location.pathname !== tab.path) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--muted-foreground)";
                  }
                }}
              >
                {tab.icon}
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content - using Outlet for nested routes */}
      <section className="px-6 lg:px-12 xl:px-16 2xl:px-24 pb-8">
        <RefreshContext.Provider value={refreshContextValue}>
          <Outlet />
        </RefreshContext.Provider>
      </section>

      {/* Hidden Scanner Component */}
      <Scanner
        ref={scannerRef}
        onImageCaptured={handleImageCaptured}
        onAnalysisComplete={handleAnalysisComplete}
        onAnalysisError={handleAnalysisError}
      />

      {/* Receipt Verification Modal */}
      {verificationReceipt && (
        <ReceiptVerification
          receiptData={verificationReceipt}
          isOpen={true}
          onClose={() => setVerificationReceipt(null)}
          onReject={() => setVerificationReceipt(null)}
          onSave={async (finalData: ReceiptData) => {
            try {
              // Zapisz zweryfikowany paragon do bazy danych
              await saveReceiptToSupabase(finalData);
              setVerificationReceipt(null); // Zamknij modal po zapisie
              setCaptureMessage("Paragon zweryfikowany i zapisany!");
              // Trigger refresh of all dashboard components
              setRefreshKey((prev) => prev + 1);
            } catch (error) {
              console.error("Błąd zapisu zweryfikowanego paragonu:", error);
              setCaptureMessage("Błąd zapisu paragonu. Spróbuj ponownie.");
            }
          }}
        />
      )}
    </div>
  );
}

// Receipts Wrapper Component
function ReceiptsWrapper() {
  const navigate = useNavigate();
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(
    null,
  );
  const { refreshKey } = useRefresh();

  return (
    <Receipts
      selectedReceiptId={selectedReceiptId}
      onReceiptSelect={setSelectedReceiptId}
      onProductClick={(productName) => {
        // Navigate to price history with the product name
        navigate(
          `/dashboard/price-history?product=${encodeURIComponent(productName)}`,
        );
      }}
      refreshKey={refreshKey}
    />
  );
}

function App() {
  return (
    <DataCacheProvider>
      <ThemeProvider>
        <TooltipProvider>
          <ScrollToTop />
          <Routes>
            {/* Public routes - accessible without authentication */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/regulamin" element={<Terms />} />
            <Route path="/polityka-prywatnosci" element={<Privacy />} />
            <Route path="/kontakt" element={<Contact />} />
            <Route path="/faq" element={<Faq />} />

            {/* Auth routes - always show regardless of authentication */}
            <Route
              path="/login"
              element={<Login onLoginSuccess={() => {}} />}
            />
            <Route
              path="/register"
              element={<Register onRegisterSuccess={() => {}} />}
            />
            <Route
              path="/reset-password"
              element={<ResetPassword onResetSuccess={() => {}} />}
            />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/success" element={<Success />} />

            {/* Dashboard route - requires authentication */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardTiles />} />
              <Route path="receipts" element={<ReceiptsWrapper />} />
              <Route path="budgets" element={<Budgets />} />
              <Route path="price-history" element={<ProductPriceHistory />} />
              <Route path="favorite-products" element={<FavoriteProducts />} />
              <Route path="achievements" element={<Achievements />} />
            </Route>
            {/* Profile route - requires authentication */}
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </TooltipProvider>
      </ThemeProvider>
    </DataCacheProvider>
  );
}

export default App;
