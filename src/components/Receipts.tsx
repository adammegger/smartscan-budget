import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import CategoryIcon from "./CategoryIcon";
import { AlertTriangle, Clover, Leaf } from "lucide-react";
import { isBioProduct } from "../lib/eco";
import { getItemTags, getMainCategory } from "../lib/categories";
import { NUTRI_SCORE_COLORS } from "../lib/openfoodfacts";

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  user_id: string | null;
}

interface Receipt {
  id: number;
  store_name: string;
  date: string;
  total_amount: number;
  category: string;
  isVisible: boolean;
  created_at: string;
}

interface Item {
  id: string;
  receipt_id: number;
  name: string;
  price: number;
  category: string;
  tags?: string[];
  created_at?: string;
  receipts?: { date: string }[];
}

interface DateFilter {
  startDate: Date | null;
  endDate: Date | null;
  period: "today" | "week" | "month" | "custom";
}

interface ReceiptsProps {
  selectedReceiptId: number | null;
  onReceiptSelect: (id: number | null) => void;
  onProductClick?: (productName: string) => void;
  dateFilter?: DateFilter;
}

export default function Receipts(props: ReceiptsProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemCounts, setItemCounts] = useState<Record<number, number>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [overBudgetCategories, setOverBudgetCategories] = useState<Set<string>>(
    new Set(),
  );

  // Fetch budgets and check which categories are over budget
  useEffect(() => {
    const fetchBudgetStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get budgets
        const { data: budgetsData } = await supabase
          .from("budgets")
          .select("category_name, amount")
          .eq("user_id", user.id);

        if (!budgetsData || budgetsData.length === 0) {
          setOverBudgetCategories(new Set());
          return;
        }

        // Get spending for current month
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const { data: receipts } = await supabase
          .from("receipts")
          .select("id")
          .eq("user_id", user.id)
          .gte("date", startOfMonth.toISOString().split("T")[0]);

        const receiptIds = receipts?.map((r) => r.id) || [];

        if (receiptIds.length === 0) {
          setOverBudgetCategories(new Set());
          return;
        }

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

        // Check which budgets are exceeded
        const overBudget = new Set<string>();
        budgetsData.forEach((budget) => {
          const spent = spendingByCategory[budget.category_name] || 0;
          if (spent > budget.amount) {
            overBudget.add(budget.category_name);
          }
        });

        setOverBudgetCategories(overBudget);
      } catch (err) {
        console.error("Error fetching budget status:", err);
      }
    };

    fetchBudgetStatus();
  }, []);

  useEffect(() => {
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
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [props.dateFilter]);

  useEffect(() => {
    const fetchItemCounts = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) return;
        const { data, error } = await supabase
          .from("items")
          .select("receipt_id")
          .eq("user_id", authUser.id)
          .in(
            "receipt_id",
            receipts.map((r) => r.id),
          );
        if (error) throw error;
        const counts: Record<number, number> = {};
        data?.forEach((item) => {
          counts[item.receipt_id] = (counts[item.receipt_id] || 0) + 1;
        });
        setItemCounts(counts);
      } catch (err) {
        console.error("Error fetching item counts:", err);
      }
    };
    if (receipts.length > 0) fetchItemCounts();
  }, [receipts]);

  const fetchItemsForReceipt = async (receiptId: number) => {
    try {
      setItemsLoading(true);
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setSelectedItems([]);
        return;
      }
      const { data, error } = await supabase
        .from("items")
        .select(
          `id, receipt_id, name, price, category, receipts!fk_items_receipt_id(date)`,
        )
        .eq("receipt_id", receiptId)
        .eq("user_id", authUser.id)
        .order("date", { foreignTable: "receipts", ascending: true });
      if (error) throw error;
      setSelectedItems(data || []);
    } catch (err) {
      console.error("Error fetching items:", err);
      setSelectedItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    if (props.selectedReceiptId) fetchItemsForReceipt(props.selectedReceiptId);
    else setSelectedItems([]);
  }, [props.selectedReceiptId]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !authUser) {
        setReceipts([]);
        setLoading(false);
        return;
      }
      let query = supabase
        .from("receipts")
        .select("*")
        .eq("user_id", authUser.id);
      if (props.dateFilter) {
        const { startDate, endDate, period } = props.dateFilter;
        if (period === "today") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          query = query
            .gte("date", today.toISOString().split("T")[0])
            .lte("date", tomorrow.toISOString().split("T")[0]);
        } else if (period === "week") {
          const today = new Date();
          const oneWeekAgo = new Date(today);
          oneWeekAgo.setDate(today.getDate() - 7);
          query = query.gte("date", oneWeekAgo.toISOString().split("T")[0]);
        } else if (period === "month") {
          const today = new Date();
          const oneMonthAgo = new Date(today);
          oneMonthAgo.setMonth(today.getMonth() - 1);
          query = query.gte("date", oneMonthAgo.toISOString().split("T")[0]);
        } else if (period === "custom" && startDate && endDate) {
          query = query
            .gte("date", startDate.toISOString().split("T")[0])
            .lte("date", endDate.toISOString().split("T")[0]);
        }
      }
      const { data, error } = await query
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReceipts(data || []);
    } catch (err) {
      console.error("Error fetching receipts:", err);
      setError("Wystąpił błąd podczas pobierania paragonów");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy", { locale: pl });
    } catch {
      return dateString;
    }
  };

  const getCategoryData = (categoryName: string) => {
    return categories.find(
      (cat) => cat.name.toLowerCase() === categoryName.toLowerCase(),
    );
  };

  const renderCategoryBadge = (categoryName: string) => {
    const categoryData = getCategoryData(categoryName);
    const color = categoryData?.color || "#6b7280";
    const isOverBudget = overBudgetCategories.has(categoryName);
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <CategoryIcon
          icon={categoryData?.icon || "MoreHorizontal"}
          color={color}
          size={12}
        />
        {categoryName}
        {isOverBudget && (
          <AlertTriangle
            size={12}
            className="ml-1 text-red-500 dark:text-red-400"
          />
        )}
      </span>
    );
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-muted-foreground">
          Ładowanie paragonów...
        </span>
      </div>
    );

  if (error)
    return (
      <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
        <p className="text-destructive">{error}</p>
        <button
          onClick={fetchReceipts}
          className="mt-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm"
        >
          Spróbuj ponownie
        </button>
      </div>
    );

  if (receipts.length === 0)
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Brak zapisanych paragonów</p>
        <p className="text-sm mt-2">
          Zeskanuj pierwszy paragon, aby go tutaj zobaczyć
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {["Data", "Sklep", "Ilość pozycji", "Kategoria", "Kwota"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-muted-foreground font-medium text-sm"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <React.Fragment key={receipt.id}>
                  <tr
                    onClick={() =>
                      props.onReceiptSelect(
                        props.selectedReceiptId === receipt.id
                          ? null
                          : receipt.id,
                      )
                    }
                    className={`border-t border-border hover:bg-muted cursor-pointer transition-colors ${props.selectedReceiptId === receipt.id ? "bg-muted" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-muted-foreground">
                        {formatDate(receipt.date)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {receipt.store_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {itemCounts[receipt.id] || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {renderCategoryBadge(receipt.category)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {receipt.total_amount.toFixed(2)} PLN
                      </div>
                    </td>
                  </tr>
                  {props.selectedReceiptId === receipt.id && (
                    <tr className="bg-muted/50">
                      <td colSpan={5} className="p-0">
                        <div className="w-full p-6 space-y-6">
                          <div>
                            <h4 className="font-semibold text-foreground text-lg mb-4">
                              Pozycje na paragonie ({selectedItems.length})
                            </h4>
                            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-transparent">
                              {itemsLoading ? (
                                <div className="text-center py-6 text-muted-foreground">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                                </div>
                              ) : selectedItems.length > 0 ? (
                                selectedItems.map((item) => {
                                  const isBio = isBioProduct(item.name);
                                  const tags = getItemTags(item);

                                  // Extract nutriscore from tags if present (single letter A-E)
                                  const nutriscore = tags.find((t) =>
                                    /^[A-E]$/i.test(t),
                                  );

                                  return (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between bg-card border border-border p-4 rounded-lg hover:bg-muted transition-colors"
                                    >
                                      <div className="flex flex-col gap-2 flex-1">
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="font-medium text-orange-500 cursor-pointer hover:text-orange-400 hover:underline transition-colors"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (props.onProductClick) {
                                                props.onProductClick(item.name);
                                              }
                                            }}
                                          >
                                            {item.name}
                                          </div>
                                          {renderCategoryBadge(item.category)}
                                        </div>
                                        {/* Special tags as icons - only show if they don't match category */}
                                        {(isBio || nutriscore) && (
                                          <div className="flex items-center gap-2">
                                            {/* BIO Icon */}
                                            {isBio && (
                                              <span
                                                className="inline-flex items-center justify-center w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full"
                                                title="Produkt BIO"
                                              >
                                                <Clover
                                                  size={14}
                                                  className="text-green-600 dark:text-green-400"
                                                />
                                              </span>
                                            )}
                                            {/* Nutri-Score Icon */}
                                            {nutriscore && (
                                              <span
                                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-bold text-white ${NUTRI_SCORE_COLORS[nutriscore.toLowerCase()] || "bg-gray-400"}`}
                                                title={`Nutri-Score: ${nutriscore.toUpperCase()}`}
                                              >
                                                {nutriscore.toUpperCase()}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <div className="font-semibold text-foreground ml-4">
                                        {item.price.toFixed(2)} PLN
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-muted-foreground text-center py-4">
                                  Brak pozycji na tym paragonie
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t border-border">
                            <span className="text-sm text-muted-foreground">
                              Zapisano:{" "}
                              {format(
                                new Date(receipt.created_at),
                                "dd.MM.yyyy HH:mm",
                                { locale: pl },
                              )}
                            </span>
                            <button
                              onClick={() => props.onReceiptSelect(null)}
                              className="text-orange-500 hover:text-orange-400 text-sm font-medium"
                            >
                              Ukryj szczegóły
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
