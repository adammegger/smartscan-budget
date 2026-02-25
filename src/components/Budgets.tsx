import { useEffect, useState, useTransition } from "react";
import { supabase } from "../lib/supabase";
import { Wallet, TrendingUp, AlertTriangle, Check, X } from "lucide-react";
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

interface BudgetsProps {
  dateFilter?: {
    startDate: Date | null;
    endDate: Date | null;
    period: "today" | "week" | "month" | "custom";
  };
  onBudgetChange?: () => void;
}

export default function Budgets(props: BudgetsProps) {
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [catsRes, budgetsRes, spendingData] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("budgets")
          .select("*")
          .eq("user_id", user.id)
          .order("category_name", { ascending: true }),
        fetchSpending(user.id),
      ]);

      setCategories(catsRes.data || []);

      const budgetsWithSpent = (budgetsRes.data || []).map((b) => ({
        ...b,
        spent: spendingData[b.category_name] || 0,
      }));

      setBudgets(budgetsWithSpent);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Błąd podczas pobierania danych");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpending = async (
    userId: string,
  ): Promise<Record<string, number>> => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let receiptsQuery = supabase
      .from("receipts")
      .select("id")
      .eq("user_id", userId)
      .gte("date", startOfMonth.toISOString().split("T")[0]);

    if (props.dateFilter && props.dateFilter.period !== "month") {
      const { startDate, period } = props.dateFilter;
      if (period === "today") {
        const todayStr = new Date().toISOString().split("T")[0];
        receiptsQuery = supabase
          .from("receipts")
          .select("id")
          .eq("user_id", userId)
          .eq("date", todayStr);
      } else if (period === "week" && startDate) {
        receiptsQuery = supabase
          .from("receipts")
          .select("id")
          .eq("user_id", userId)
          .gte("date", startDate.toISOString().split("T")[0]);
      }
    }

    const { data: receipts } = await receiptsQuery;
    const receiptIds = receipts?.map((r) => r.id) || [];

    if (receiptIds.length === 0) return {};

    const { data: items } = await supabase
      .from("items")
      .select("price, category")
      .eq("user_id", userId)
      .in("receipt_id", receiptIds);

    const spending: Record<string, number> = {};
    items?.forEach((item) => {
      const price =
        typeof item.price === "number"
          ? item.price
          : parseFloat(String(item.price).replace(",", "."));
      spending[item.category] = (spending[item.category] || 0) + price;
    });

    return spending;
  };

  const getCategoryColor = (categoryName: string) => {
    const cat = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
    );
    return cat?.color || "#6b7280";
  };

  const getCategoryIcon = (categoryName: string) => {
    const cat = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
    );
    return cat?.icon || "MoreHorizontal";
  };

  const handleStartEdit = (budget: BudgetWithSpending) => {
    setEditingCategory(budget.category_name);
    setEditAmount(budget.amount.toString());
  };

  const handleStartAdd = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditAmount("");
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setEditAmount("");
  };

  const handleSave = async () => {
    if (!editingCategory) return;

    const amountValue = editAmount.replace(",", ".");
    const amount = parseFloat(amountValue);
    if (isNaN(amount) || amount <= 0) {
      setError("Podaj prawidłową kwotę");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    setError(null);

    const existingBudget = budgets.find(
      (b) => b.category_name === editingCategory,
    );

    try {
      if (existingBudget) {
        // Optimistic update
        startTransition(() => {
          setBudgets((prev) =>
            prev.map((b) =>
              b.category_name === editingCategory
                ? { ...b, amount, spent: b.spent }
                : b,
            ),
          );
        });

        const { error } = await supabase
          .from("budgets")
          .update({ amount, updated_at: new Date().toISOString() })
          .eq("id", existingBudget.id);

        if (error) throw error;
      } else {
        // Optimistic add - create temp ID
        const tempId = Date.now();

        startTransition(() => {
          setBudgets((prev) => [
            ...prev,
            {
              id: tempId,
              user_id: user.id,
              category_name: editingCategory,
              amount,
              period: "monthly",
              spent: 0,
            },
          ]);
        });

        const { error } = await supabase.from("budgets").insert({
          user_id: user.id,
          category_name: editingCategory,
          amount,
          period: "monthly",
        });

        if (error) throw error;
      }

      handleCancel();
      props.onBudgetChange?.();
    } catch (err: unknown) {
      console.error("Error saving:", err);
      // Rollback on error
      await fetchData();
      const msg = err instanceof Error ? err.message : "Błąd";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (budgetId: number) => {
    // Optimistic delete
    const budgetToDelete = budgets.find((b) => b.id === budgetId);
    if (!budgetToDelete) return;

    startTransition(() => {
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    });

    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", budgetId);
      if (error) throw error;
      props.onBudgetChange?.();
    } catch (err) {
      console.error("Error deleting:", err);
      // Rollback
      await fetchData();
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-orange-500";
    return "bg-green-500";
  };

  const getProgressTextColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-orange-500";
    return "text-green-500";
  };

  const totalBudget = budgets.reduce((t, b) => t + b.amount, 0);
  const totalSpent = budgets.reduce((t, b) => t + b.spent, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-muted-foreground">Ładowanie...</span>
      </div>
    );
  }

  // Get categories without budgets
  const categoriesWithoutBudget = categories.filter(
    (cat) =>
      !budgets.find(
        (b) => b.category_name.toLowerCase() === cat.name.toLowerCase(),
      ),
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">Budżet</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {totalSpent.toFixed(0)} / {totalBudget.toFixed(0)} PLN
            </span>
            {totalBudget > 0 && (
              <span
                className={getProgressTextColor(
                  (totalSpent / totalBudget) * 100,
                )}
              >
                {((totalSpent / totalBudget) * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        {totalBudget > 0 && (
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${getProgressColor((totalSpent / totalBudget) * 100)} transition-all duration-300`}
              style={{
                width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Budget List - All in one list with inline editing */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border bg-muted/50">
          <span className="text-sm font-medium text-muted-foreground">
            Twoje budżety
          </span>
        </div>

        {budgets.length === 0 && categoriesWithoutBudget.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Brak kategorii</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Existing budgets with inline edit */}
            {budgets.map((budget) => {
              const percentage =
                budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
              const isOverBudget = percentage > 100;
              const isEditing = editingCategory === budget.category_name;

              return (
                <div
                  key={budget.id}
                  className="p-3 hover:bg-muted/30 transition-colors"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                      <CategoryIcon
                        icon={getCategoryIcon(budget.category_name)}
                        color={getCategoryColor(budget.category_name)}
                        size={20}
                      />
                      <span className="font-medium flex-1">
                        {budget.category_name}
                      </span>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-24 px-2 py-1 bg-background border border-border rounded text-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      />
                      <span className="text-xs text-muted-foreground">PLN</span>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <CategoryIcon
                        icon={getCategoryIcon(budget.category_name)}
                        color={getCategoryColor(budget.category_name)}
                        size={20}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {budget.category_name}
                          </span>
                          {isOverBudget && (
                            <AlertTriangle
                              size={14}
                              className="text-red-500 shrink-0"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(percentage)} transition-all duration-300`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs whitespace-nowrap ${getProgressTextColor(percentage)}`}
                          >
                            {budget.spent.toFixed(0)}/{budget.amount.toFixed(0)}{" "}
                            PLN
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartEdit(budget)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                      >
                        <TrendingUp size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Categories without budgets - inline add */}
            {categoriesWithoutBudget.map((cat) => {
              const isAdding = editingCategory === cat.name;

              return (
                <div
                  key={cat.id}
                  className="p-3 hover:bg-muted/30 transition-colors"
                >
                  {isAdding ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
                      <CategoryIcon
                        icon={cat.icon}
                        color={cat.color}
                        size={20}
                      />
                      <span className="font-medium flex-1">{cat.name}</span>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="0"
                        className="w-24 px-2 py-1 bg-background border border-border rounded text-sm"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      />
                      <span className="text-xs text-muted-foreground">PLN</span>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <CategoryIcon
                        icon={cat.icon}
                        color={cat.color}
                        size={20}
                      />
                      <span className="font-medium flex-1 text-muted-foreground">
                        {cat.name}
                      </span>
                      <button
                        onClick={() => handleStartAdd(cat.name)}
                        className="px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors"
                      >
                        + Dodaj
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
