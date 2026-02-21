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

      // First, get filtered receipts based on date
      let receiptsQuery = supabase.from("receipts").select("id");

      if (props.dateFilter && props.dateFilter.period) {
        const { startDate, endDate, period } = props.dateFilter;

        if (period === "today") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          receiptsQuery = receiptsQuery
            .gte("date", today.toISOString().split("T")[0])
            .lte("date", tomorrow.toISOString().split("T")[0]);
        } else if (period === "week") {
          const today = new Date();
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(today.getDate() - 7);

          receiptsQuery = receiptsQuery.gte(
            "date",
            oneWeekAgo.toISOString().split("T")[0],
          );
        } else if (period === "month") {
          const today = new Date();
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(today.getMonth() - 1);

          receiptsQuery = receiptsQuery.gte(
            "date",
            oneMonthAgo.toISOString().split("T")[0],
          );
        } else if (period === "custom" && startDate && endDate) {
          receiptsQuery = receiptsQuery
            .gte("date", startDate.toISOString().split("T")[0])
            .lte("date", endDate.toISOString().split("T")[0]);
        }
      }

      const { data: filteredReceipts, error: receiptsError } =
        await receiptsQuery;

      if (receiptsError) {
        throw receiptsError;
      }

      // Get items for the filtered receipts
      const receiptIds = filteredReceipts.map((receipt) => receipt.id);
      const { data, error } = await supabase
        .from("items")
        .select("name, price, category")
        .in("receipt_id", receiptIds);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setCategorySummary([]);
        setLoading(false);
        return;
      }

      // Calculate category totals from all items
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

      // Convert to array and sort by total amount (descending)
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Food":
        return "bg-green-900/30 text-green-300 border border-green-800/50";
      case "Transport":
        return "bg-blue-900/30 text-blue-300 border border-blue-800/50";
      case "Home":
        return "bg-yellow-900/30 text-yellow-300 border border-yellow-800/50";
      case "Health":
        return "bg-red-900/30 text-red-300 border border-red-800/50";
      case "Entertainment":
        return "bg-purple-900/30 text-purple-300 border border-purple-800/50";
      case "Clothing":
        return "bg-pink-900/30 text-pink-300 border border-pink-800/50";
      case "Electronics":
        return "bg-cyan-900/30 text-cyan-300 border border-cyan-800/50";
      case "Education":
        return "bg-indigo-900/30 text-indigo-300 border border-indigo-800/50";
      case "Travel":
        return "bg-teal-900/30 text-teal-300 border border-teal-800/50";
      case "Sports":
        return "bg-orange-900/30 text-orange-300 border border-orange-800/50";
      case "Beauty":
        return "bg-rose-900/30 text-rose-300 border border-rose-800/50";
      case "Pets":
        return "bg-emerald-900/30 text-emerald-300 border border-emerald-800/50";
      case "Gifts":
        return "bg-violet-900/30 text-violet-300 border border-violet-800/50";
      case "Bills":
        return "bg-slate-900/30 text-slate-300 border border-slate-800/50";
      case "Insurance":
        return "bg-amber-900/30 text-amber-300 border border-amber-800/50";
      default:
        return "bg-zinc-800/50 text-zinc-300 border border-zinc-700/50";
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
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-center text-gray-400 mt-2">
          Ładowanie podsumowania...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
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
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 backdrop-blur-sm text-center">
        <p className="text-gray-400">
          Brak danych do wyświetlenia podsumowania
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Zeskanuj paragony, aby zobaczyć podsumowanie według kategorii
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Summary */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-white font-semibold text-lg mb-2">
          Łączne wydatki
        </h3>
        <div className="text-3xl font-bold text-orange-400">
          {getTotalSpent().toFixed(2)} PLN
        </div>
        <p className="text-gray-400 text-sm mt-1">
          z {categorySummary.reduce((total, cat) => total + cat.count, 0)}{" "}
          pozycji
        </p>
      </div>

      {/* Collapsible Category Section */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
        {/* Header with Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-800/50 transition-colors duration-200"
        >
          <h3 className="text-white font-semibold text-lg">
            Podział według kategorii
          </h3>
          <div className="flex items-center space-x-4">
            <span className="text-gray-400 text-sm">
              {categorySummary.length} kategorii
            </span>
            <div
              className={`transition-transform duration-200 ${isCollapsed ? "rotate-0" : "rotate-180"}`}
            >
              {isCollapsed ? (
                <ChevronDown size={20} className="text-gray-400" />
              ) : (
                <ChevronUp size={20} className="text-gray-400" />
              )}
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="border-t border-zinc-700/50">
            {/* Category Breakdown */}
            <div className="p-6">
              <h4 className="text-white font-medium text-md mb-4">
                Szczegółowy podział
              </h4>
              <div className="space-y-3">
                {categorySummary.map((category) => (
                  <div
                    key={category.category}
                    className="flex items-center justify-between bg-zinc-800/50 p-3 rounded border border-zinc-700/50"
                  >
                    <div className="space-y-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                          category.category,
                        )}`}
                      >
                        {category.category}
                      </span>
                      <div className="text-gray-400 text-sm">
                        {category.count} pozycji
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-lg">
                        {category.total.toFixed(2)} PLN
                      </div>
                      <div className="text-gray-400 text-sm">
                        {((category.total / getTotalSpent()) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Grid Summary */}
            <div className="p-6 border-t border-zinc-700/50">
              <h4 className="text-white font-medium text-md mb-4">
                Szybki podgląd kategorii
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categorySummary.map((category) => (
                  <div
                    key={category.category}
                    className={`p-3 rounded text-center border border-zinc-700/50 ${getCategoryColor(
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
