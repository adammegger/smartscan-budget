import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

interface CategorySummaryProps {
  dateFilter?: {
    startDate: Date | null;
    endDate: Date | null;
    period: "today" | "week" | "month" | "custom";
  };
}

export default function CategorySummary(props: CategorySummaryProps) {
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    fetchCategorySummary();
  }, [
    props.dateFilter?.startDate,
    props.dateFilter?.endDate,
    props.dateFilter?.period,
  ]);

  const fetchCategorySummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setCategorySummary([]);
        setLoading(false);
        return;
      }

      let receiptsQuery = supabase
        .from("receipts")
        .select("id, total_amount")
        .eq("user_id", authUser.id);

      // Use the dateFilter from props directly - filter by 'date' column (receipt date), NOT created_at
      const { startDate, endDate, period } = props.dateFilter || {};

      // Helper to get YYYY-MM-DD without timezone issues
      const toDateString = (date: Date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const today = new Date();
      const todayStr = toDateString(today);

      if (period === "today") {
        // Today - filter by exact date match
        receiptsQuery = receiptsQuery.eq("date", todayStr);
        console.log("Filtering by today:", todayStr);
      } else if (period === "week") {
        // Last 7 days - always use last 7 days regardless of startDate
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        receiptsQuery = receiptsQuery
          .gte("date", toDateString(sevenDaysAgo))
          .lte("date", todayStr);
        console.log(
          "Filtering by last 7 days:",
          toDateString(sevenDaysAgo),
          "to:",
          todayStr,
        );
      } else if (period === "month") {
        // Last 30 days - always use last 30 days to include all recent receipts
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        receiptsQuery = receiptsQuery
          .gte("date", toDateString(thirtyDaysAgo))
          .lte("date", todayStr);
        console.log(
          "Filtering by last 30 days (month):",
          toDateString(thirtyDaysAgo),
          "to:",
          todayStr,
        );
      } else if (period === "custom" && startDate && endDate) {
        // Custom range - use exact dates
        receiptsQuery = receiptsQuery
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0]);
        console.log(
          "Filtering by custom:",
          startDate.toISOString().split("T")[0],
          "to:",
          endDate.toISOString().split("T")[0],
        );
      } else if (startDate && endDate) {
        // Fallback: use dates directly if provided
        receiptsQuery = receiptsQuery
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0]);
        console.log(
          "Filtering by fallback dates:",
          startDate.toISOString().split("T")[0],
          "to:",
          endDate.toISOString().split("T")[0],
        );
      } else if (startDate) {
        // If only startDate is provided, use last 30 days default from that date
        const effectiveStart = new Date(startDate);
        const effectiveEnd = new Date();
        receiptsQuery = receiptsQuery
          .gte("date", effectiveStart.toISOString().split("T")[0])
          .lte("date", effectiveEnd.toISOString().split("T")[0]);
        console.log(
          "Filtering by start date only:",
          effectiveStart.toISOString().split("T")[0],
        );
      } else {
        // No filter - get all receipts (last 30 days as default)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        receiptsQuery = receiptsQuery.gte(
          "date",
          thirtyDaysAgo.toISOString().split("T")[0],
        );
        console.log("No filter, defaulting to last 30 days");
      }

      const { data: filteredReceipts, error: receiptsError } =
        await receiptsQuery;

      if (receiptsError) {
        throw receiptsError;
      }

      // Debug: log receipts used for total
      console.log("Receipts used for total:", filteredReceipts);

      // Calculate total from receipts.total_amount directly
      const computedTotal = filteredReceipts.reduce((sum, r) => {
        const amount = r.total_amount || 0;
        return sum + Number(amount);
      }, 0);
      console.log("Computed total from receipts:", computedTotal);
      setTotalFromReceipts(computedTotal);

      const receiptIds = filteredReceipts.map((receipt) => receipt.id);
      const { data, error } = await supabase
        .from("items")
        .select("name, price, category")
        .eq("user_id", authUser.id)
        .in("receipt_id", receiptIds);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setCategorySummary([]);
        setLoading(false);
        return;
      }

      const categoryTotals = new Map<
        string,
        { total: number; count: number }
      >();

      data.forEach((item) => {
        const hasEnglishFields = "name" in item;
        const itemCategory = hasEnglishFields
          ? (item as { category: string }).category
          : (item as { kategoria: string }).kategoria;
        const itemPrice = hasEnglishFields
          ? (item as { price: string | number }).price
          : (item as { cena: string }).cena;

        const price =
          typeof itemPrice === "number"
            ? itemPrice
            : parseFloat(itemPrice.replace(",", "."));

        const currentData = categoryTotals.get(itemCategory) || {
          total: 0,
          count: 0,
        };
        categoryTotals.set(itemCategory, {
          total: currentData.total + price,
          count: currentData.count + 1,
        });
      });

      const sortedCategories = Array.from(categoryTotals.entries())
        .map(([category, data]) => ({
          category,
          total: data.total,
          count: data.count,
        }))
        .sort((a, b) => b.total - a.total);

      setCategorySummary(sortedCategories);
    } catch (err) {
      console.error("Error fetching category summary:", err);
      setError("Wystąpił błąd podczas pobierania podsumowania kategorii");
    } finally {
      setLoading(false);
    }
  };

  // Store the total computed directly from receipts
  const [totalFromReceipts, setTotalFromReceipts] = useState<number>(0);

  const getCategoryColor = (category: string) => {
    switch (category) {
      // Polish category names
      case "Jedzenie":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50";
      case "Transport":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/50";
      case "Dom":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50";
      case "Zdrowie":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50";
      case "Rozrywka":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50";
      case "Ubrania":
        return "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800/50";
      case "Elektronika":
        return "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/50";
      case "Edukacja":
        return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50";
      case "Podróże":
        return "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/50";
      case "Sport":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/50";
      case "Uroda":
        return "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50";
      case "Zwierzęta":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50";
      case "Prezenty":
        return "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800/50";
      case "Rachunki":
        return "bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-800/50";
      case "Inne":
      case "Mieszane":
      case "Restauracje":
      case "Alkohol":
      case "Apteka":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800/50";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const getTotalSpent = () => {
    return categorySummary.reduce(
      (total, category) => total + category.total,
      0,
    );
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-center text-muted-foreground mt-2">
          Ładowanie podsumowania...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchCategorySummary}
          className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (categorySummary.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <p className="text-muted-foreground">
          Brak danych do wyświetlenia podsumowania
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Zeskanuj paragony, aby zobaczyć podsumowanie według kategorii
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Summary */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-foreground font-semibold text-lg mb-2">
          Łączne wydatki
        </h3>
        <div className="text-3xl font-bold text-orange-500">
          {totalFromReceipts.toFixed(2)} PLN
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          z {categorySummary.reduce((total, cat) => total + cat.count, 0)}{" "}
          pozycji
        </p>
      </div>

      {/* Collapsible Category Section */}
      <div className="bg-card border border-border rounded-xl">
        {/* Header with Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-muted transition-colors duration-200"
        >
          <h3 className="text-foreground font-semibold text-lg">
            Podział według kategorii
          </h3>
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground text-sm">
              {categorySummary.length} kategorii
            </span>
            <div
              className={`transition-transform duration-200 ${isCollapsed ? "rotate-0" : "rotate-180"}`}
            >
              {isCollapsed ? (
                <ChevronDown size={20} className="text-muted-foreground" />
              ) : (
                <ChevronUp size={20} className="text-muted-foreground" />
              )}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="border-t border-border">
            {/* Category Breakdown */}
            <div className="p-6">
              <h4 className="text-foreground font-medium text-md mb-4">
                Szczegółowy podział
              </h4>
              <div className="space-y-3">
                {categorySummary.map((category) => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between bg-muted p-3 rounded border border-border"
                  >
                    <div className="space-y-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                          category.category,
                        )}`}
                      >
                        {category.category}
                      </span>
                      <div className="text-muted-foreground text-sm">
                        {category.count} pozycji
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-foreground font-bold text-lg">
                        {category.total.toFixed(2)} PLN
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {((category.total / getTotalSpent()) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Grid Summary */}
            <div className="p-6 border-t border-border">
              <h4 className="text-foreground font-medium text-md mb-4">
                Szybki podgląd kategorii
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categorySummary.map((category) => (
                  <div
                    key={category.category}
                    className={`p-3 rounded text-center border border-border ${getCategoryColor(
                      category.category,
                    )}`}
                  >
                    <div className="font-semibold text-sm">
                      {category.category}
                    </div>
                    <div className="text-xs opacity-80 mt-1">
                      {category.total.toFixed(2)} PLN
                    </div>
                    <div className="text-xs opacity-60 mt-1">
                      {category.count} poz.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
