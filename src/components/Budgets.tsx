import { useEffect, useState, useTransition } from "react";
import { supabase } from "../lib/supabase";
import { getCategoryColor, getCategoryIcon } from "../lib/categoryCache";
import { Wallet, Pencil, AlertTriangle, Check, X } from "lucide-react";
import CategoryIcon from "./CategoryIcon";
import { motion, AnimatePresence } from "framer-motion";
import { useDataCache, useCacheValid } from "../lib/cacheUtils";
import ProModalGate from "./ProModalGate";
import { FREE_TIER_LIMITS, getBudgetsText } from "../lib/config";
import { useRefresh } from "../lib/refreshContext";
import { useScanning } from "../lib/scanningContext";

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
  const [showProLimitModal, setShowProLimitModal] = useState(false);
  const [, startTransition] = useTransition();

  // Data cache
  const { budgetCache, setBudgetCache } = useDataCache();
  const isCacheValid = useCacheValid(budgetCache);

  // Use refresh context to listen for refresh triggers
  const { refreshKey } = useRefresh();

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  // Initialize with cached data if available
  useEffect(() => {
    if (budgetCache && isCacheValid) {
      setBudgets(budgetCache.budgets);
      setCategories(budgetCache.categories);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [budgetCache, isCacheValid, refreshKey]);

  // Listen for global receiptAdded event to refresh data
  useEffect(() => {
    const handleReceiptAdded = () => {
      fetchData();
    };

    window.addEventListener("receiptAdded", handleReceiptAdded);
    return () => window.removeEventListener("receiptAdded", handleReceiptAdded);
  }, []);

  const fetchData = async () => {
    try {
      // Only show loading state on initial mount, not during background refreshes
      if (budgets.length === 0) {
        setLoading(true);
      }

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

      // Store in cache
      setBudgetCache({
        budgets: budgetsWithSpent,
        categories: catsRes.data || [],
        lastFetched: Date.now(),
      });
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

    // Always fetch current month spending for budgets, regardless of global date filter
    const receiptsQuery = supabase
      .from("receipts")
      .select("id")
      .eq("user_id", userId)
      .gte("date", startOfMonth.toISOString().split("T")[0]);

    const { data: receipts } = await receiptsQuery;
    const receiptIds = receipts?.map((r) => r.id) || [];

    if (receiptIds.length === 0) return {};

    // Fetch items with category matching - use category field for budget matching
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

      // Use category name for matching with budgets.category_name
      const categoryName = item.category;
      spending[categoryName] = (spending[categoryName] || 0) + price;
    });

    return spending;
  };

  const handleStartEdit = (budget: BudgetWithSpending) => {
    setEditingCategory(budget.category_name);
    setEditAmount(budget.amount.toString());
  };

  const handleStartAdd = async (categoryName: string) => {
    // Get user profile to check subscription tier
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    // Check if user is on free tier and has reached the limit
    if (
      profile?.subscription_tier === "free" &&
      budgets.length >= FREE_TIER_LIMITS.MAX_BUDGETS
    ) {
      setShowProLimitModal(true);
      return;
    }

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

        // Calculate spent amount for the new budget category
        const spendingData = await fetchSpending(user.id);
        const spentForCategory = spendingData[editingCategory] || 0;

        startTransition(() => {
          setBudgets((prev) => [
            ...prev,
            {
              id: tempId,
              user_id: user.id,
              category_name: editingCategory,
              amount,
              period: "monthly",
              spent: spentForCategory,
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
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budżety</h1>
          <p className="text-muted-foreground">
            Twoje miesięczne limity wydatków według kategorii. Kliknij "Dodaj"
            aby ustawić budżet dla danej kategorii
          </p>
        </div>
      </div>
      {/* Summary */}
      <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
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
              className={`h-full ${getProgressColor((totalSpent / totalBudget) * 100)} transition-all duration-500 ease-out`}
              style={{
                width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Budget List - All in one list with inline editing */}
      <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border/50 bg-muted/50">
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
            {/* Active Budgets Section */}
            {budgets.length > 0 && (
              <div className="space-y-3 p-3">
                <div className="text-sm font-medium text-muted-foreground border-b border-border/50 pb-2">
                  Aktywne budżety
                </div>
                <AnimatePresence mode="popLayout">
                  {budgets.map((budget) => {
                    const percentage =
                      budget.amount > 0
                        ? (budget.spent / budget.amount) * 100
                        : 0;
                    const isOverBudget = percentage > 100;
                    const isEditing = editingCategory === budget.category_name;

                    return (
                      <motion.div
                        key={budget.id}
                        layoutId={`budget-${budget.category_name}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-3 hover:bg-muted/30 transition-colors border border-border/50 rounded-lg"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2">
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
                              className="w-24 px-2 py-1 bg-background rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              autoFocus
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleSave()
                              }
                              style={{
                                border: "none",
                                appearance: "textfield",
                                MozAppearance: "textfield",
                              }}
                            />
                            <span className="text-xs text-muted-foreground">
                              PLN
                            </span>
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
                                    className={`h-full ${getProgressColor(percentage)} transition-all duration-500 ease-out`}
                                    style={{
                                      width: `${Math.min(percentage, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span
                                  className={`text-xs whitespace-nowrap ${getProgressTextColor(percentage)} transition-all duration-500 ease-out`}
                                >
                                  {budget.spent.toFixed(0)}/
                                  {budget.amount.toFixed(0)} PLN
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleStartEdit(budget)}
                              className="cursor-pointer p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(budget.id)}
                              className="cursor-pointer p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Available Budgets Section */}
            {categoriesWithoutBudget.length > 0 && (
              <div className="space-y-3 p-3">
                <div className="text-sm font-medium text-muted-foreground border-b border-border/50 pb-2">
                  Dostępne budżety
                </div>
                <AnimatePresence mode="popLayout">
                  {categoriesWithoutBudget.map((cat) => {
                    const isAdding = editingCategory === cat.name;

                    return (
                      <motion.div
                        key={cat.id}
                        layoutId={`available-${cat.name}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-3 hover:bg-muted/30 transition-colors border border-border/50 rounded-lg"
                      >
                        {isAdding ? (
                          <div className="flex items-center gap-2">
                            <CategoryIcon
                              icon={cat.icon}
                              color={cat.color}
                              size={20}
                            />
                            <span className="font-medium flex-1">
                              {cat.name}
                            </span>
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              placeholder="0"
                              className="w-24 px-2 py-1 bg-background rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              autoFocus
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleSave()
                              }
                              style={{
                                border: "none",
                                appearance: "textfield",
                                MozAppearance: "textfield",
                              }}
                            />
                            <span className="text-xs text-muted-foreground">
                              PLN
                            </span>
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition-colors cursor-pointer"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors cursor-pointer"
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
                              className="px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors cursor-pointer"
                            >
                              + Dodaj
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Budget Limit Modal */}
      <ProModalGate
        isOpen={showProLimitModal}
        onClose={() => setShowProLimitModal(false)}
        title="Osiągnięto limit budżetów"
        message={`W darmowym planie możesz śledzić maksymalnie ${getBudgetsText(FREE_TIER_LIMITS.MAX_BUDGETS)}. Przejdź na plan PRO, aby tworzyć nielimitowaną liczbę budżetów i mieć pełną kontrolę nad każdą złotówką.`}
      />
    </div>
  );
}
