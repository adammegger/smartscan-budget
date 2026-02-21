import { Camera, Calendar, Filter } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import Scanner from "./components/Scanner";
import Receipts from "./components/Receipts";
import CategorySummary from "./components/CategorySummary";

function App() {
  const [supabaseStatus, setSupabaseStatus] = useState<
    "loading" | "connected" | "error"
  >("loading");
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
  const scannerRef = useRef<React.ElementRef<typeof Scanner>>(null);

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-12 px-4">
      {/* Header */}
      <header className="px-6 py-8">
        <div className="flex justify-center items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Witaj!</h1>
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
        </div>
      </header>

      {/* Scan Button */}
      <section className="px-6 py-8">
        <div className="flex justify-center">
          <div className="space-y-4">
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
            <div className="text-center">
              <span className="text-lg font-semibold text-gray-300">
                {isAnalyzing ? "ANALIZUJĘ..." : "SKANUJ PARAGON"}
              </span>
            </div>
          </div>
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

      {/* Date Filter Section */}
      <section className="px-6 pb-6">
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar size={20} />
              Filtr dat
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Filter size={16} />
              {dateFilter.period === "today" && "Dziś"}
              {dateFilter.period === "week" && "Ostatni tydzień"}
              {dateFilter.period === "month" && "Ostatni miesiąc"}
              {dateFilter.period === "custom" && "Okres niestandardowy"}
            </div>
          </div>

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
                    period: period.key as "today" | "week" | "month" | "custom",
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
      </section>

      {/* Receipts Section */}
      <section className="px-6 pb-8">
        <Receipts
          selectedReceiptId={selectedReceiptId}
          onReceiptSelect={setSelectedReceiptId}
          dateFilter={dateFilter}
        />
        <div className="mt-8">
          <CategorySummary dateFilter={dateFilter} />
        </div>
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

export default App;
