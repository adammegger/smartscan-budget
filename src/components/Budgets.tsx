import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Wallet, TrendingUp, AlertTriangle, Check, X } from "lucide-react";
import CategoryIcon from "./CategoryIcon";

interface Budget {
  id: number;
  user_id: string;
  category_name: string;
  amount: number;
  period: string;
  created_at: string;
  updated_at: string;
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
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetsWithSpending, setBudgetsWithSpending] = useState<
    BudgetWithSpending[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<{
    id: number | null;
    category: string | null;
  }>({ id: null, category: null });
  const [editAmount, setEditAmount] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [totalSpending, setTotalSpending] = useState<number>(0);

  useEffect(() => {
    fetchCategories();
    fetchBudgets();
  }, []);

  useEffect(() => {
    fetchSpendingAndUpdateBudgets();
  }, [props.dateFilter, budgets]);

  const fetchCategories = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("category_name", { ascending: true });

      if (error) throw error;
      setBudgets(data || []);
    } catch (err) {
      console.error("Error fetching budgets:", err);
      setError("Błąd podczas pobierania budżetów");
    } finally {
      setLoading(false);
    }
  };

  const fetchSpendingAndUpdateBudgets = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      let receiptsQuery = supabase
        .from("receipts")
        .select("id")
        .eq("user_id", user.id)
        .gte("date", startOfMonth.toISOString().split("T")[0]);

      if (props.dateFilter && props.dateFilter.period !== "month") {
        const { startDate, endDate, period } = props.dateFilter;

        if (period === "today") {
          const todayStr = new Date().toISOString().split("T")[0];
          receiptsQuery = supabase
            .from("receipts")
            .select("id")
            .eq("user_id", user.id)
            .eq("date", todayStr);
        } else if (period === "week" && startDate) {
          receiptsQuery = supabase
            .from("receipts")
            .select("id")
            .eq("user_id", user.id)
            .gte("date", startDate.toISOString().split("T")[0]);
        } else if (period === "custom" && startDate && endDate) {
          receiptsQuery = supabase
            .from("receipts")
            .select("id")
            .eq("user_id", user.id)
            .gte("date", startDate.toISOString().split("T")[0])
            .lte("date", endDate.toISOString().split("T")[0]);
        }
      }

      const { data: receipts } = await receiptsQuery;
      const receiptIds = receipts?.map((r) => r.id) || [];

      if (receiptIds.length === 0) {
        setBudgetsWithSpending(budgets.map((b) => ({ ...b, spent: 0 })));
        setTotalSpending(0);
        return;
      }

      const { data: items } = await supabase
        .from("items")
        .select("price, category")
        .eq("user_id", user.id)
        .in("receipt_id", receiptIds);

      let total = 0;
      const spendingByCategory: Record<string, number> = {};
      items?.forEach((item) => {
        const category = item.category;
        const price =
          typeof item.price === "number"
            ? item.price
            : parseFloat(String(item.price).replace(",", "."));
        total += price;
        spendingByCategory[category] =
          (spendingByCategory[category] || 0) + price;
      });

      const budgetsWithSpent = budgets.map((budget) => ({
        ...budget,
        spent: spendingByCategory[budget.category_name] || 0,
      }));

      setBudgetsWithSpending(budgetsWithSpent);
      setTotalSpending(total);
    } catch (err) {
      console.error("Error fetching spending:", err);
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

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget({ id: budget.id, category: budget.category_name });
    setEditAmount(budget.amount.toString());
  };

  const handleStartAddBudget = (categoryName: string) => {
    setEditingBudget({ id: -1, category: categoryName });
    setEditAmount("");
  };

  const handleCancelEdit = () => {
    setEditingBudget({ id: null, category: null });
    setEditAmount("");
  };

  const handleSaveBudget = async () => {
    const categoryName = editingBudget.category;
    if (!categoryName) return;

    try {
      setSaving(true);
      setError(null);

      const amountValue = editAmount.replace(",", ".");
      const amount = parseFloat(amountValue);

      if (isNaN(amount) || amount <= 0) {
        setError("Podaj prawidłową kwotę");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Błąd autentykacji");
        return;
      }

      console.log("Saving budget:", categoryName, amount);

      if (editingBudget.id && editingBudget.id > 0) {
        // Update existing
        const { error } = await supabase
          .from("budgets")
          .update({ amount, updated_at: new Date().toISOString() })
          .eq("id", editingBudget.id);
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from("budgets").insert({
          user_id: user.id,
          category_name: categoryName,
          amount,
          period: "monthly",
        });
        if (error) throw error;
      }

      console.log("Budget saved!");
      handleCancelEdit();
      await fetchBudgets();
      await fetchSpendingAndUpdateBudgets();
      props.onBudgetChange?.();
    } catch (err: unknown) {
      console.error("Error saving budget:", err);
      const msg = err instanceof Error ? err.message : "Nieznany błąd";
      setError(`Błąd: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (budgetId: number) => {
    try {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", budgetId);
      if (error) throw error;
      fetchBudgets();
      props.onBudgetChange?.();
    } catch (err) {
      console.error("Error deleting budget:", err);
      setError("Błąd podczas usuwania budżetu");
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

  const getTotalBudget = () =>
    budgetsWithSpending.reduce((t, b) => t + b.amount, 0);
  const getTotalSpent = () =>
    budgetsWithSpending.length > 0
      ? budgetsWithSpending.reduce((t, b) => t + b.spent, 0)
      : totalSpending;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-muted-foreground">
          Ładowanie budżetów...
        </span>
      </div>
    );
  }

  if (error && budgets.length === 0) {
    return (
      <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={fetchBudgets}
          className="mt-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Wallet className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-foreground font-semibold text-lg">
            Podsumowanie budżetów
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <div className="text-muted-foreground text-sm">Łączny budżet</div>
            <div className="text-2xl font-bold text-foreground">
              {getTotalBudget().toFixed(2)} PLN
            </div>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <div className="text-muted-foreground text-sm">Wydano</div>
            <div
              className={`text-2xl font-bold ${getTotalSpent() > getTotalBudget() ? "text-red-500" : "text-foreground"}`}
            >
              {getTotalSpent().toFixed(2)} PLN
            </div>
          </div>
        </div>

        {getTotalBudget() > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Wykorzystano</span>
              <span
                className={getProgressTextColor(
                  (getTotalSpent() / getTotalBudget()) * 100,
                )}
              >
                {((getTotalSpent() / getTotalBudget()) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor((getTotalSpent() / getTotalBudget()) * 100)} transition-all duration-300`}
                style={{
                  width: `${Math.min((getTotalSpent() / getTotalBudget()) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Budget List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-foreground font-semibold">Limity budżetowe</h3>
          <p className="text-muted-foreground text-sm">
            Ustaw miesięczne limity dla kategorii
          </p>
        </div>

        {budgetsWithSpending.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Brak ustawionych budżetów</p>
            <p className="text-sm mt-1">Dodaj limity dla kategorii poniżej</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {budgetsWithSpending.map((budget) => {
              const percentage =
                budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
              const isOverBudget = percentage > 100;
              const isEditing = editingBudget.id === budget.id;

              return (
                <div key={budget.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CategoryIcon
                        icon={getCategoryIcon(budget.category_name)}
                        color={getCategoryColor(budget.category_name)}
                        size={24}
                      />
                      <div>
                        <div className="font-medium text-foreground">
                          {budget.category_name}
                        </div>
                        {isOverBudget && (
                          <div className="flex items-center gap-1 text-red-500 text-xs">
                            <AlertTriangle size={12} />
                            <span>
                              Przekroczono o{" "}
                              {(budget.spent - budget.amount).toFixed(2)} PLN
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-24 px-2 py-1 bg-muted border border-border rounded text-foreground text-sm"
                            placeholder="Kwota"
                          />
                          <button
                            onClick={handleSaveBudget}
                            disabled={saving}
                            className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-muted-foreground hover:bg-muted rounded"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-right mr-3">
                            <div className="font-semibold text-foreground">
                              {budget.spent.toFixed(2)} /{" "}
                              {budget.amount.toFixed(2)} PLN
                            </div>
                            <div
                              className={`text-xs ${getProgressTextColor(percentage)}`}
                            >
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditBudget(budget)}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                          >
                            <TrendingUp size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(percentage)} transition-all duration-300`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add New Budget Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-foreground font-semibold mb-4">
          Dodaj nowy budżet
        </h3>

        <div className="space-y-3">
          {categories
            .filter((cat) => !budgets.find((b) => b.category_name === cat.name))
            .map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CategoryIcon
                    icon={category.icon}
                    color={category.color}
                    size={24}
                  />
                  <span className="font-medium text-foreground">
                    {category.name}
                  </span>
                </div>
                <button
                  onClick={() => handleStartAddBudget(category.name)}
                  className="px-3 py-1 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
                >
                  Dodaj
                </button>
              </div>
            ))}

          {categories.filter(
            (cat) => !budgets.find((b) => b.category_name === cat.name),
          ).length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Wszystkie kategorie mają już ustawione budżety
            </p>
          )}
        </div>

        {/* Inline edit for new budgets */}
        {editingBudget.id === -1 && editingBudget.category && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-medium text-foreground">
                {editingBudget.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded text-foreground"
                placeholder="Wprowadź kwotę budżetu"
                autoFocus
              />
              <button
                onClick={handleSaveBudget}
                disabled={saving}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
              >
                {saving ? "..." : "Zapisz"}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded transition-colors"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 mt-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
