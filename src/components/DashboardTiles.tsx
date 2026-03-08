import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import CategoryIcon from "./CategoryIcon";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

// Budget Monitor Component
interface BudgetMonitorProps {
  dateFilter?: {
    startDate: Date | null;
    endDate: Date | null;
    period: "today" | "week" | "month" | "last30" | "custom";
  };
}

interface BudgetData {
  category_name: string;
  amount: number;
  spent: number;
}

// eslint-disable-next-line no-empty-pattern
const BudgetMonitor: React.FC<BudgetMonitorProps> = ({}) => {
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgetData();
  }, []); // Removed dateFilter dependency to make it independent

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setBudgets([]);
        setLoading(false);
        return;
      }

      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", authUser.id);

      if (budgetsError) throw budgetsError;

      if (!budgetsData || budgetsData.length === 0) {
        setBudgets([]);
        setLoading(false);
        return;
      }

      // Build fixed monthly date filter (independent of global filters)
      let receiptsQuery = supabase
        .from("receipts")
        .select("id")
        .eq("user_id", authUser.id);

      // Calculate current month range
      const today = new Date();
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      );

      const toDateString = (date: Date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      // Always use current month range regardless of global date filter
      receiptsQuery = receiptsQuery
        .gte("date", toDateString(firstDayOfMonth))
        .lte("date", toDateString(lastDayOfMonth));

      const { data: filteredReceipts, error: receiptsError } =
        await receiptsQuery;

      if (receiptsError) throw receiptsError;

      const receiptIds = filteredReceipts?.map((receipt) => receipt.id) || [];

      if (receiptIds.length === 0) {
        // No receipts in period, set all spent to 0
        const budgetsWithSpent = budgetsData.map((budget) => ({
          category_name: budget.category_name,
          amount: budget.amount || 0,
          spent: 0,
        }));
        setBudgets(budgetsWithSpent);
        setLoading(false);
        return;
      }

      // Fetch spending for each budget category
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("price, category")
        .eq("user_id", authUser.id)
        .in("receipt_id", receiptIds);

      if (itemsError) throw itemsError;

      // Calculate spending per category
      const spendingMap = new Map<string, number>();
      items?.forEach((item) => {
        const price =
          typeof item.price === "number"
            ? item.price
            : parseFloat(String(item.price || 0).replace(",", "."));
        spendingMap.set(
          item.category,
          (spendingMap.get(item.category) || 0) + price,
        );
      });

      // Combine budgets with spending
      const budgetsWithSpent = budgetsData.map((budget) => ({
        category_name: budget.category_name,
        amount: budget.amount || 0,
        spent: spendingMap.get(budget.category_name) || 0,
      }));

      setBudgets(budgetsWithSpent);
    } catch (err) {
      console.error("Error fetching budget data:", err);
      setError("Wystąpił błąd podczas pobierania danych budżetowych");
    } finally {
      setLoading(false);
    }
  };

  const totalBudget = useMemo(
    () => budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0),
    [budgets],
  );
  const totalSpent = useMemo(
    () => budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0),
    [budgets],
  );
  const remaining = totalBudget - totalSpent;
  const overallPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (loading) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-center text-muted-foreground mt-2">Ładowanie...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Nie masz jeszcze ustawionych budżetów. Przejdź do sekcji Budżet, aby
            zacząć planowanie.
          </p>
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
        </div>
      </div>
    );
  }

  // Get current month name for display
  const currentMonth = new Date().toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg">
      {/* Header with month information */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-muted-foreground">
          Budżet na{" "}
          {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}
        </h3>
      </div>

      {/* Upper Section - Overall Budget */}
      <div className="text-center mb-4">
        {remaining < 0 ? (
          <div className="text-3xl font-bold text-red-400 mb-6">
            Przekroczono budżet o {Math.abs(remaining).toFixed(0)} PLN
          </div>
        ) : remaining === 0 ? (
          <div className="text-3xl font-bold text-yellow-400 mb-6">
            Jesteśmy na równi z budżetem
          </div>
        ) : (
          <div className="text-3xl font-bold text-green-400 mb-6">
            Pozostało: {remaining.toFixed(0)} PLN
          </div>
        )}
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden mb-1">
          <div
            className={`h-full transition-all duration-300 ${
              overallPercentage >= 100 ? "bg-red-500" : "bg-green-500"
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {totalSpent.toFixed(0)} / {totalBudget.toFixed(0)} PLN (
          {overallPercentage.toFixed(0)}%)
        </div>
      </div>

      {/* Lower Section - Categories */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-muted-foreground border-b border-border pb-2">
          Kategorie z budżetem
        </div>
        <div className="space-y-3">
          {budgets.map((budget) => {
            const percentage =
              (budget.amount || 0) > 0
                ? ((budget.spent || 0) / (budget.amount || 0)) * 100
                : 0;
            const isOverBudget = percentage > 100;
            const categoryColor = getCategoryColor(budget.category_name);

            return (
              <div
                key={budget.category_name}
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border"
              >
                {/* Top Row: Category name and amount */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-medium text-sm"
                      style={{ color: categoryColor }}
                    >
                      {budget.category_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold text-sm ${
                        isOverBudget ? "text-red-500" : "text-foreground"
                      }`}
                    >
                      {(budget.spent || 0).toFixed(0)} /{" "}
                      {(budget.amount || 0).toFixed(0)} PLN
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Progress bar */}
                <div className="w-full">
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{
                      backgroundColor: categoryColor + "30", // 30% opacity
                    }}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverBudget ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const getCategoryColor = (categoryName: string) => {
  const CATEGORY_COLORS: Record<string, string> = {
    Jedzenie: "#22c55e",
    Transport: "#3b82f6",
    Dom: "#eab308",
    Zdrowie: "#ef4444",
    Rozrywka: "#a855f7",
    Ubrania: "#ec4899",
    Elektronika: "#06b6d4",
    Edukacja: "#6366f1",
    Podróże: "#0ea5e9",
    Sport: "#84cc16",
    Uroda: "#f43f5e",
    Zwierzęta: "#f97316",
    Prezenty: "#d946ef",
    Rachunki: "#64748b",
    Restauracje: "#8b5cf6",
    Apteka: "#14b8a6",
    Alkohol: "#dc2626",
    Inne: "#6b7280",
  };
  return CATEGORY_COLORS[categoryName] || "#6b7280";
};

// Color palette for categories
const CATEGORY_COLORS: Record<string, string> = {
  Jedzenie: "#22c55e",
  Transport: "#3b82f6",
  Dom: "#eab308",
  Zdrowie: "#ef4444",
  Rozrywka: "#a855f7",
  Ubrania: "#ec4899",
  Elektronika: "#06b6d4",
  Edukacja: "#6366f1",
  Podróże: "#0ea5e9",
  Sport: "#84cc16",
  Uroda: "#f43f5e",
  Zwierzęta: "#f97316",
  Prezenty: "#d946ef",
  Rachunki: "#64748b",
  Restauracje: "#8b5cf6",
  Apteka: "#14b8a6",
  Alkohol: "#dc2626",
  Inne: "#6b7280",
};

interface DashboardStats {
  totalSpent: number;
  receiptCount: number;
  averageNutriScore: string;
  mostPopularProduct: {
    name: string;
    count: number;
  } | null;
}

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface DashboardTilesProps {
  dateFilter?: {
    startDate: Date | null;
    endDate: Date | null;
    period: "today" | "week" | "month" | "last30" | "custom";
  };
  refreshTrigger?: number;
}

export default function DashboardTiles(props: DashboardTilesProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalSpent: 0,
    receiptCount: 0,
    averageNutriScore: "A",
    mostPopularProduct: null,
  });
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greenLeavesCount, setGreenLeavesCount] = useState<number>(0);
  const [bioPercentage, setBioPercentage] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, [
    props.dateFilter?.startDate,
    props.dateFilter?.endDate,
    props.dateFilter?.period,
    props.refreshTrigger,
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setStats({
          totalSpent: 0,
          receiptCount: 0,
          averageNutriScore: "A",
          mostPopularProduct: null,
        });
        setCategoryData([]);
        setLoading(false);
        return;
      }

      // Build date filter
      let receiptsQuery = supabase
        .from("receipts")
        .select("id, total_amount, date")
        .eq("user_id", authUser.id);

      const { startDate, endDate, period } = props.dateFilter || {};
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
        receiptsQuery = receiptsQuery.eq("date", todayStr);
      } else if (period === "week") {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        receiptsQuery = receiptsQuery
          .gte("date", toDateString(sevenDaysAgo))
          .lte("date", todayStr);
      } else if (period === "month") {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        receiptsQuery = receiptsQuery
          .gte("date", toDateString(thirtyDaysAgo))
          .lte("date", todayStr);
      } else if (period === "custom" && startDate && endDate) {
        receiptsQuery = receiptsQuery
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0]);
      } else if (startDate && endDate) {
        receiptsQuery = receiptsQuery
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0]);
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        receiptsQuery = receiptsQuery.gte(
          "date",
          thirtyDaysAgo.toISOString().split("T")[0],
        );
      }

      const { data: filteredReceipts, error: receiptsError } =
        await receiptsQuery;

      if (receiptsError) throw receiptsError;

      const receiptIds = filteredReceipts.map((receipt) => receipt.id);

      if (receiptIds.length === 0) {
        setStats({
          totalSpent: 0,
          receiptCount: 0,
          averageNutriScore: "A",
          mostPopularProduct: null,
        });
        setCategoryData([]);
        setLoading(false);
        return;
      }

      // Fetch items for category analysis
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("name, price, category")
        .eq("user_id", authUser.id)
        .in("receipt_id", receiptIds);

      if (itemsError) throw itemsError;

      // Calculate stats
      const totalSpent = filteredReceipts.reduce((sum, receipt) => {
        const amount =
          typeof receipt.total_amount === "number"
            ? receipt.total_amount
            : parseFloat(String(receipt.total_amount || 0).replace(",", "."));
        return sum + amount;
      }, 0);
      const receiptCount = filteredReceipts.length;

      // Calculate average Nutri-Score (placeholder - column doesn't exist yet)
      const averageNutriScore = "A";

      // Calculate most popular product
      let mostPopularProduct = null;
      if (items && items.length > 0) {
        const productCounts = new Map<string, number>();

        items.forEach((item) => {
          const productName = item.name?.trim();
          if (productName) {
            productCounts.set(
              productName,
              (productCounts.get(productName) || 0) + 1,
            );
          }
        });

        if (productCounts.size > 0) {
          let maxCount = 0;
          let mostPopularName = "";

          productCounts.forEach((count, name) => {
            if (count > maxCount) {
              maxCount = count;
              mostPopularName = name;
            }
          });

          mostPopularProduct = {
            name: mostPopularName,
            count: maxCount,
          };
        }
      }

      // Calculate BIO products percentage and green leaves count dynamically
      // Filter items by date range to match the dashboard period
      let itemsQuery = supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id);

      // Apply the same date filter as for receipts
      if (receiptIds.length > 0) {
        itemsQuery = itemsQuery.in("receipt_id", receiptIds);
      } else {
        // If no receipts in period, set counts to 0
        setGreenLeavesCount(0);
        setBioPercentage(0);
      }

      const { count: totalProductsCount } = await itemsQuery;

      const { count: bioProductsCount } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", authUser.id)
        .eq("is_bio", true)
        .in("receipt_id", receiptIds);

      const bioPercentage =
        totalProductsCount && totalProductsCount > 0
          ? Math.round(((bioProductsCount || 0) / totalProductsCount) * 100)
          : 0;

      // Green leaves count = number of BIO products in the selected period
      setGreenLeavesCount(bioProductsCount || 0);
      setBioPercentage(bioPercentage);

      setStats({
        totalSpent,
        receiptCount,
        averageNutriScore,
        mostPopularProduct,
      });

      // Calculate category data
      if (!items || items.length === 0) {
        setCategoryData([]);
        setLoading(false);
        return;
      }

      const categoryTotals = new Map<
        string,
        { total: number; count: number }
      >();

      items.forEach((item) => {
        const itemCategory = item.category;
        const price =
          typeof item.price === "number"
            ? item.price
            : parseFloat(String(item.price).replace(",", "."));

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

      setCategoryData(sortedCategories);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Wystąpił błąd podczas pobierania danych");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalSpent = useMemo(
    () => categoryData.reduce((sum, cat) => sum + cat.total, 0),
    [categoryData],
  );

  // Prepare chart data
  const chartData = useMemo(
    () =>
      categoryData.map((cat) => ({
        name: cat.category,
        value: cat.total,
        color: CATEGORY_COLORS[cat.category] || CATEGORY_COLORS["Inne"],
      })),
    [categoryData],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-center text-muted-foreground mt-2">Ładowanie...</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-center text-muted-foreground mt-2">Ładowanie...</p>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-center text-muted-foreground mt-2">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchData}
          className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  // Check if there are any receipts (if no receipts, hide the chart)
  const hasReceipts = stats.receiptCount > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Budget Monitor Tile */}
      <div className="lg:col-span-4">
        <BudgetMonitor dateFilter={props.dateFilter} />
      </div>

      {/* Top Stats Tiles */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <div className="text-4xl font-bold text-green-500 mb-2">
                {new Intl.NumberFormat("pl-PL", {
                  style: "currency",
                  currency: "PLN",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(stats.totalSpent)}
              </div>
              <div className="text-sm text-green-500">
                {(() => {
                  switch (props.dateFilter?.period) {
                    case "today":
                      return "W tym dniu";
                    case "week":
                      return "W tym tygodniu";
                    case "month":
                      return "W tym miesiącu";
                    case "last30":
                      return "W ostatnich 30 dniach";
                    case "custom":
                      return "W tym okresie";
                    default:
                      return "W tym miesiącu";
                  }
                })()}
              </div>
            </CardHeader>
          </Card>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-sm font-medium border-none text-white shadow-lg bg-gradient-to-r from-orange-500 to-red-500 p-3"
        >
          <p>
            Łączna kwota wydatków zarejestrowanych z Twoich paragonów w wybranym
            przedziale czasowym.
          </p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {stats.receiptCount}
              </div>
              <div className="text-sm text-blue-500">Zeskanowane paragony</div>
            </CardHeader>
          </Card>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-sm font-medium border-none text-white shadow-lg bg-gradient-to-r from-orange-500 to-red-500 p-3"
        >
          <p>
            Liczba paragonów, które zostały dodane do Paragonly w tym okresie.
          </p>
        </TooltipContent>
      </Tooltip>

      {/* Green Leaves Count Tile */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">
                {greenLeavesCount}
              </div>
              <div className="text-sm text-green-500">Zielone Listki</div>
            </CardHeader>
          </Card>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-sm font-medium border-none text-white shadow-lg bg-gradient-to-r from-orange-500 to-red-500 p-3"
        >
          <p>
            Liczba zebranych punktów ekologicznych. Otrzymujesz 1 listek za
            każdy kupiony produkt oznaczony jako BIO lub EKO.
          </p>
        </TooltipContent>
      </Tooltip>

      {/* BIO Products Percentage Tile */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">
                {bioPercentage}%
              </div>
              <div className="text-sm text-green-500">Twoje eko-wybory</div>
            </CardHeader>
          </Card>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-sm font-medium border-none text-white shadow-lg bg-gradient-to-r from-orange-500 to-red-500 p-3"
        >
          <p>
            Odsetek wszystkich Twoich zakupów, które stanowią produkty
            ekologiczne w wybranym okresie.
          </p>
        </TooltipContent>
      </Tooltip>

      {/* Most Popular Product Tile */}
      <Card className="lg:col-span-4 transition-colors cursor-pointer">
        <CardHeader className="text-center flex flex-col justify-center h-full">
          {stats.mostPopularProduct ? (
            <>
              <div className="text-3xl font-bold text-purple-400 mb-1">
                {stats.mostPopularProduct.name}
              </div>
              <div className="text-sm text-purple-400">
                Najczęściej kupowany produkt ({stats.mostPopularProduct.count}{" "}
                razy)
              </div>
            </>
          ) : (
            <div className="text-sm text-purple-400 font-medium">
              Brak danych dla tego okresu
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Chart Tile - Only render if there are receipts */}
      {hasReceipts && (
        <Card className="lg:col-span-4 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Donut Chart */}
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value, name) => [
                        `${Number(value || 0).toFixed(2)} PLN`,
                        name || "",
                      ]}
                      labelFormatter={(label) => label || ""}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        color: "#1e293b",
                      }}
                      wrapperStyle={{ zIndex: 100 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category List */}
              <div className="flex-1 overflow-hidden">
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
                  {categoryData.map((category) => {
                    const percentage =
                      totalSpent > 0 ? (category.total / totalSpent) * 100 : 0;
                    const color =
                      CATEGORY_COLORS[category.category] ||
                      CATEGORY_COLORS["Inne"];

                    return (
                      <div
                        key={category.category}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border"
                      >
                        {/* Left side: Category badge */}
                        <div
                          className="flex items-center gap-2 px-3 py-1 rounded-full border-2"
                          style={{
                            backgroundColor: color + "15", // 15% opacity background
                            borderColor: color,
                          }}
                        >
                          <CategoryIcon
                            icon={category.category}
                            color={color}
                            size={16}
                          />
                          <span
                            className="font-medium text-sm"
                            style={{ color: color }}
                          >
                            {category.category}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            ({category.count})
                          </span>
                        </div>

                        {/* Right side: Amount and percentage */}
                        <div className="text-right gap-2">
                          <span className="font-bold text-foreground text-sm">
                            {category.total.toFixed(2)} PLN
                          </span>
                          <span className="text-muted-foreground text-xs ml-2">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
