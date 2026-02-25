import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import CategoryIcon from "./CategoryIcon";

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
    period: "today" | "week" | "month" | "custom";
  };
}

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

  useEffect(() => {
    fetchData();
  }, [
    props.dateFilter?.startDate,
    props.dateFilter?.endDate,
    props.dateFilter?.period,
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
      const totalSpent = filteredReceipts.reduce(
        (sum, receipt) => sum + (receipt.total_amount || 0),
        0,
      );
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
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-center text-muted-foreground mt-2">Ładowanie...</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-center text-muted-foreground mt-2">Ładowanie...</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top Stats Tiles */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
        <div className="text-center">
          <div className="text-4xl font-bold text-green-400 mb-2">
            {stats.totalSpent.toFixed(0)} PLN
          </div>
          <div className="text-sm text-green-400">W tym miesiącu</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-400 mb-2">
            {stats.receiptCount}
          </div>
          <div className="text-sm text-blue-400">Zeskanowane paragony</div>
        </div>
      </div>

      {/* Most Popular Product Tile */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
        <div className="text-center">
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
            <div className="text-sm text-muted-foreground">
              Brak danych dla tego okresu
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Tile */}
      <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
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
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value).toFixed(2)} PLN`,
                    name,
                  ]}
                  labelFormatter={(label) => label}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    color: "#1e293b",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="overflow-hidden">
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
              {categoryData.map((category) => {
                const percentage =
                  totalSpent > 0 ? (category.total / totalSpent) * 100 : 0;
                const color =
                  CATEGORY_COLORS[category.category] || CATEGORY_COLORS["Inne"];

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
      </div>
    </div>
  );
}
