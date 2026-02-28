import { Outlet } from "react-router-dom";
import { useEnsureProfile } from "../hooks/useEnsureProfile";
import { useTheme } from "../lib/theme";
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
import { supabase } from "../lib/supabase";
import Scanner from "./Scanner";
import { useLocation } from "react-router-dom";

/**
 * AuthenticatedLayout - Layout component for authenticated users
 *
 * This component:
 * - Ensures user profile exists (creates if missing)
 * - Provides main navigation
 * - Handles theme toggle
 * - Manages scanner functionality
 * - Renders child routes via Outlet
 *
 * Usage: Wrap authenticated routes with this layout
 */
export default function AuthenticatedLayout() {
  const { profile, loading, error } = useEnsureProfile();
  const { theme, toggleTheme } = useTheme();
  const [supabaseStatus, setSupabaseStatus] = useState<
    "loading" | "connected" | "error"
  >("loading");
  const [captureMessage, setCaptureMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scannerRef = useRef<React.ElementRef<typeof Scanner>>(null);
  const location = useLocation();

  // Update active tab based on current route
  const getActiveTab = (path: string) => {
    if (path.includes("dashboard")) return "dashboard";
    if (path.includes("receipts")) return "receipts";
    if (path.includes("budgets")) return "budgets";
    if (path.includes("price-history")) return "priceHistory";
    if (path.includes("achievements")) return "achievements";
    return "";
  };

  const [activeTab, setActiveTab] = useState(() =>
    getActiveTab(location.pathname),
  );

  // Check Supabase connection status
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleImageCaptured = (imageData: string | Blob) => {
    setCaptureMessage("Paragon uchwycony! Przygotowuję do analizy…");
    setIsAnalyzing(true);

    setTimeout(() => {
      setCaptureMessage("");
    }, 3000);

    console.log("Image captured:", imageData);
  };

  const handleAnalysisComplete = (receiptData: unknown) => {
    setIsAnalyzing(false);
    setCaptureMessage("Paragon zapisany pomyślnie!");

    setTimeout(() => {
      setCaptureMessage("");
    }, 3000);

    console.log("Receipt analysis complete:", receiptData);
  };

  const handleAnalysisError = (error: string) => {
    setIsAnalyzing(false);
    setCaptureMessage(`Błąd: ${error}`);

    setTimeout(() => {
      setCaptureMessage("");
    }, 5000);

    console.error("Analysis error:", error);
  };

  const triggerScan = () => {
    scannerRef.current?.triggerCamera();
  };

  // Show loading state while fetching profile
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show error state if profile fetch failed
  if (error) {
    console.error("Profile error:", error);
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="px-6 lg:px-12 xl:px-16 2xl:px-24 py-8">
          <div className="bg-destructive/10 border border-destructive/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Problem z wczytaniem profilu
            </h2>
            <p className="text-destructive/80">
              Wystąpił błąd podczas ładowania Twojego profilu. Spróbuj odświeżyć
              stronę lub skontaktuj się z pomocą techniczną.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-12">
      {/* Header */}
      <header className="px-6 lg:px-12 xl:px-16 2xl:px-24 py-8 fixed top-0 left-0 right-0 bg-background border-b border-border/50 z-50">
        <div className="flex justify-between items-center">
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

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? "Jasny" : "Ciemny"}
            </button>

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
        <div className="bg-card border border-border/50 rounded-xl">
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

      {/* Main Content */}
      <section className="px-6 lg:px-12 xl:px-16 2xl:px-24 pb-8">
        {/* Pass profile data to child components via context or props */}
        <div
          className="hidden"
          id="profile-data"
          data-profile={JSON.stringify(profile)}
        />
        <Outlet context={{ profile }} />
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
