import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AlertTriangle } from "lucide-react";
import CategoryIcon from "./CategoryIcon";

interface Budget {
  id: number;
  user_id: string;
  category_name: string;
  amount: number;
  period: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface BudgetWithSpending extends Budget {
  spent: number;
}

interface BudgetProgressProps {
  dateFilter?: {
    startDate: Date | null;
    endDate: Date | null;
    period: "today" | "week" | "month" | "custom";
  };
}

export default function BudgetProgress(props: BudgetProgressProps) {
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [props.dateFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order("name", { ascending: true });

      setCategories(categoriesData || []);

      // Fetch budgets
      const { data: budgetsData } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("category_name", { ascending: true });

      if (!budgetsData || budgetsData.length === 0) {
        setBudgets([]);
        setLoading(false);
        return;
      }

      // Build date filter - always use the dateFilter from props
      const { startDate, endDate, period } = props.dateFilter || {};

      let receiptsQuery = supabase
        .from("receipts")
        .select("id")
        .eq("user_id", user.id);

      // Apply date filter based on period
      if (period === "today") {
        const todayStr = new Date().toISOString().split("T")[0];
        receiptsQuery = receiptsQuery.eq("date", todayStr);
      } else if (period === "week" && startDate) {
        receiptsQuery = receiptsQuery.gte(
          "date",
          startDate.toISOString().split("T")[0],
        );
      } else if (period === "month") {
        // Default to current month if no dates provided
        const monthStart =
          startDate ||
          new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const monthEnd = endDate || new Date();
        receiptsQuery = receiptsQuery
          .gte("date", monthStart.toISOString().split("T")[0])
          .lte("date", monthEnd.toISOString().split("T")[0]);
      } else if (period === "custom" && startDate && endDate) {
        receiptsQuery = receiptsQuery
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0]);
      } else if (startDate && endDate) {
        // Fallback: if dates are provided but period is not recognized, use dates
        receiptsQuery = receiptsQuery
          .gte("date", startDate.toISOString().split("T")[0])
          .lte("date", endDate.toISOString().split("T")[0]);
      } else {
        // No filter - get all receipts (last 30 days as default)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        receiptsQuery = receiptsQuery.gte(
          "date",
          thirtyDaysAgo.toISOString().split("T")[0],
        );
      }

      const { data: receipts } = await receiptsQuery;
      const receiptIds = receipts?.map((r) => r.id) || [];

      if (receiptIds.length === 0) {
        setBudgets(budgetsData.map((b) => ({ ...b, spent: 0 })));
        setLoading(false);
        return;
      }

      // Get items for these receipts
      const { data: items } = await supabase
        .from("items")
        .select("price, category")
        .eq("user_id", user.id)
        .in("receipt_id", receiptIds);

      // Calculate spending per category
      const spendingByCategory: Record<string, number> = {};
      items?.forEach((item) => {
        const category = item.category;
        const price =
          typeof item.price === "number"
            ? item.price
            : parseFloat(String(item.price).replace(",", "."));
        spendingByCategory[category] =
          (spendingByCategory[category] || 0) + price;
      });

      // Update budgets with spending
      const budgetsWithSpent = budgetsData.map((budget) => ({
        ...budget,
        spent: spendingByCategory[budget.category_name] || 0,
      }));

      setBudgets(budgetsWithSpent);
    } catch (err) {
      console.error("Error fetching budget progress:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
    );
    return category?.color || "#6b7280";
  };

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
    );
    return category?.icon || "MoreHorizontal";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-orange-500";
    return "bg-green-500";
  };

  const getProgressBarBgColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500/20 dark:bg-red-500/10";
    if (percentage >= 70) return "bg-orange-500/20 dark:bg-orange-500/10";
    return "bg-green-500/20 dark:bg-green-500/10";
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500 dark:text-red-400";
    if (percentage >= 70) return "text-orange-500 dark:text-orange-400";
    return "text-green-500 dark:text-green-400";
  };

  // Get top 3 budgets by amount (or by spending if over budget)
  const topBudgets = [...budgets]
    .sort((a, b) => {
      const percentageA = a.amount > 0 ? (a.spent / a.amount) * 100 : 0;
      const percentageB = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
      return percentageB - percentageA;
    })
    .slice(0, 3);

  if (loading) {
    return null;
  }

  if (budgets.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border-2 border-orange-500/20 dark:border-orange-500/30 rounded-xl p-4 shadow-sm">
      <h3 className="text-foreground font-semibold text-sm mb-4 flex items-center gap-2">
        <span>Postępy budżetów</span>
        <span className="text-muted-foreground font-normal text-xs">
          (Top 3)
        </span>
      </h3>

      <div className="space-y-3">
        {topBudgets.map((budget) => {
          const percentage =
            budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
          const isOverBudget = percentage > 100;
          const displayPercentage = Math.min(percentage, 100);

          return (
            <div key={budget.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CategoryIcon
                    icon={getCategoryIcon(budget.category_name)}
                    color={getCategoryColor(budget.category_name)}
                    size={18}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {budget.category_name}
                  </span>
                  {isOverBudget && (
                    <AlertTriangle
                      size={14}
                      className="text-red-500 dark:text-red-400"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${getTextColor(percentage)}`}
                  >
                    {percentage.toFixed(0)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {budget.spent.toFixed(0)}/{budget.amount.toFixed(0)} PLN
                  </span>
                </div>
              </div>
              <div
                className={`h-2 rounded-full overflow-hidden ${getProgressBarBgColor(percentage)}`}
              >
                <div
                  className={`h-full ${getProgressColor(percentage)} transition-all duration-500 rounded-full`}
                  style={{ width: `${displayPercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
