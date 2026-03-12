import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getCategoryColor, getCategoryIcon } from "../lib/categoryCache";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import CategoryIcon from "./CategoryIcon";
import { getIconComponent } from "../lib/categories";
import {
  AlertTriangle,
  Trash2,
  Download,
  Pencil,
  CheckCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { isBioProduct } from "../lib/eco";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./ui/table";
import TimeFilter from "./TimeFilter";
import { useDataCache, useCacheValid } from "../lib/cacheUtils";
import ProModalGate from "./ProModalGate";
import ReceiptVerification from "./ReceiptVerification";
import { useRefresh } from "../lib/refreshContext";
import { useScanning } from "../lib/scanningContext";

interface Receipt {
  id: number;
  store_name: string;
  date: string;
  total_amount: number;
  category: string;
  category_id?: string | null;
  isVisible: boolean;
  created_at: string;
}

interface Item {
  id: string;
  receipt_id: number;
  name: string;
  price: number;
  category: string;
  quantity?: number;
  unit_price?: number;
  tags?: string[];
  created_at?: string;
  receipts?: { date: string }[];
}

interface ReceiptsProps {
  onProductClick?: (productName: string) => void;
  timeFilter?: "today" | "week" | "month" | "year" | "all";
  refreshKey?: number;
  selectedReceiptId?: number | null;
  onReceiptSelect?: (receiptId: number | null) => void;
}

export default function Receipts(props: ReceiptsProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemsByReceipt, setItemsByReceipt] = useState<Record<number, Item[]>>(
    {},
  );
  const [itemsLoading, setItemsLoading] = useState<Record<number, boolean>>({});
  const [itemCounts, setItemCounts] = useState<Record<number, number>>({});
  const [overBudgetCategories, setOverBudgetCategories] = useState<Set<string>>(
    new Set(),
  );
  // Stan do zarządzania rozwiniętymi paragonami
  const [expandedReceiptIds, setExpandedReceiptIds] = useState<Set<number>>(
    new Set(),
  );
  // Stan do zarządzania otwartym modalem
  const [receiptToDelete, setReceiptToDelete] = useState<number | null>(null);
  // Stan do zarządzania filtrem czasu
  const [timeFilter, setTimeFilter] = useState<
    "today" | "week" | "month" | "year" | "all"
  >(props.timeFilter || "month");
  // Stan do śledzenia pierwszego załadowania
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  // Stan do modalu PRO
  const [showProModal, setShowProModal] = useState(false);
  // Stan do edycji paragonu
  const [receiptToEdit, setReceiptToEdit] = useState<{
    store_name: string;
    date: string;
    total_amount: number;
    category: string;
    category_id: string | null;
    items: Array<{
      name: string;
      price: number;
      category: string;
      category_id: string | null;
      unit: string;
      quantity: number;
      is_bio: boolean;
    }>;
  } | null>(null);
  const [editingReceiptId, setEditingReceiptId] = useState<number | null>(null);

  // Toast state for notifications
  const [toastMsg, setToastMsg] = useState<{
    title: string;
    type: "success" | "error";
  } | null>(null);

  // Helper to show toast that auto-hides after 3 seconds
  const showToast = (title: string, type: "success" | "error" = "success") => {
    setToastMsg({ title, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Funkcja do przełączania rozwinięcia paragonu
  const handleToggleReceipt = (receiptId: number) => {
    setExpandedReceiptIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(receiptId)) {
        newSet.delete(receiptId);
      } else {
        newSet.add(receiptId);
        fetchItemsForReceipt(receiptId); // Fetch items if not already fetched
      }
      return newSet;
    });
  };

  // Data cache
  const { receiptCache, setReceiptCache } = useDataCache();
  const isCacheValid = useCacheValid(receiptCache);

  // Use refresh context to listen for refresh triggers
  const { refreshKey } = useRefresh();

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
    fetchReceipts();
  }, [timeFilter]);

  // Watch for refreshKey changes to force a refresh
  useEffect(() => {
    if (props.refreshKey !== undefined) {
      fetchReceipts();
    }
  }, [props.refreshKey, refreshKey]);

  // Initialize with cached data if available
  useEffect(() => {
    if (receiptCache && isCacheValid) {
      setReceipts(receiptCache.receipts);
      setItemCounts(receiptCache.itemCounts);
      setHasLoadedOnce(true);
      setLoading(false);
    } else if (!hasLoadedOnce) {
      fetchReceipts();
    }
  }, [receiptCache, isCacheValid, hasLoadedOnce]);

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
    // If we already fetched these items, don't do it again!
    if (itemsByReceipt[receiptId]) return;

    try {
      setItemsLoading((prev) => ({ ...prev, [receiptId]: true }));
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setItemsByReceipt((prev) => ({ ...prev, [receiptId]: [] }));
        return;
      }
      const { data, error } = await supabase
        .from("items")
        .select(
          `id, receipt_id, name, price, category, quantity, receipts!fk_items_receipt_id(date)`,
        )
        .eq("receipt_id", receiptId)
        .eq("user_id", authUser.id)
        .order("date", { foreignTable: "receipts", ascending: true });
      if (error) throw error;
      setItemsByReceipt((prev) => ({ ...prev, [receiptId]: data || [] }));
    } catch (err) {
      console.error("Error fetching items:", err);
      setItemsByReceipt((prev) => ({ ...prev, [receiptId]: [] }));
    } finally {
      setItemsLoading((prev) => ({ ...prev, [receiptId]: false }));
    }
  };

  useEffect(() => {
    // Fetch items for newly expanded receipts
    expandedReceiptIds.forEach((receiptId) => {
      if (!itemsByReceipt[receiptId]) {
        fetchItemsForReceipt(receiptId);
      }
    });
  }, [expandedReceiptIds]);

  const handleDeleteReceipt = async (receiptId: number) => {
    try {
      // Delete associated items first
      const { error: itemsError } = await supabase
        .from("items")
        .delete()
        .eq("receipt_id", receiptId);

      if (itemsError) throw itemsError;

      // Delete the receipt
      const { error: receiptError } = await supabase
        .from("receipts")
        .delete()
        .eq("id", receiptId);

      if (receiptError) throw receiptError;

      // Update local state
      setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
      setItemCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[receiptId];
        return newCounts;
      });

      // Clear items for deleted receipt
      setItemsByReceipt((prev) => {
        const newItems = { ...prev };
        delete newItems[receiptId];
        return newItems;
      });

      // Show success toast
      showToast("Paragon został usunięty", "success");
    } catch (error) {
      console.error("Błąd podczas usuwania paragonu:", error);
      // Show error toast instead of setting error state
      showToast("Nie udało się usunąć paragonu", "error");
    }
  };

  const fetchReceipts = async () => {
    try {
      // Only show loading spinner on initial mount, not when switching filters
      if (!hasLoadedOnce) {
        setLoading(true);
      }
      setError(null);
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !authUser) {
        setReceipts([]);
        if (!hasLoadedOnce) {
          setLoading(false);
        }
        return;
      }
      let query = supabase
        .from("receipts")
        .select("*")
        .eq("user_id", authUser.id);

      // Apply time filter
      if (timeFilter) {
        const now = new Date();
        const toDateString = (date: Date) => {
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        if (timeFilter === "today") {
          query = query.eq("date", toDateString(now));
        } else if (timeFilter === "week") {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query = query
            .gte("date", toDateString(oneWeekAgo))
            .lte("date", toDateString(now));
        } else if (timeFilter === "month") {
          const oneMonthAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000,
          );
          query = query
            .gte("date", toDateString(oneMonthAgo))
            .lte("date", toDateString(now));
        } else if (timeFilter === "year") {
          const oneYearAgo = new Date(
            now.getTime() - 365 * 24 * 60 * 60 * 1000,
          );
          query = query
            .gte("date", toDateString(oneYearAgo))
            .lte("date", toDateString(now));
        }
        // For "all", we don't apply date filter
      }

      const { data, error } = await query
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Update receipts without clearing them first - seamless update
      setReceipts(data || []);

      // Calculate item counts for caching
      const receiptIds = data?.map((r) => r.id) || [];
      const { data: items } = await supabase
        .from("items")
        .select("receipt_id")
        .eq("user_id", authUser.id)
        .in("receipt_id", receiptIds);

      const itemCounts: Record<number, number> = {};
      items?.forEach((item) => {
        itemCounts[item.receipt_id] = (itemCounts[item.receipt_id] || 0) + 1;
      });

      // Store in cache
      setReceiptCache({
        receipts: data || [],
        itemCounts,
        lastFetched: Date.now(),
      });

      // Mark that we've loaded at least once
      if (!hasLoadedOnce) {
        setHasLoadedOnce(true);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching receipts:", err);
      setError("Wystąpił błąd podczas pobierania paragonów");
      if (!hasLoadedOnce) {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy", { locale: pl });
    } catch {
      return dateString;
    }
  };

  const renderCategoryBadge = (categoryName: string) => {
    const color = getCategoryColor(categoryName);
    const icon = getCategoryIcon(categoryName);
    const isOverBudget = overBudgetCategories.has(categoryName);

    // Debug: Log category data
    console.log(
      "Receipts - Category value passed to getIconComponent:",
      categoryName,
    );

    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <div
          className="p-1 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          {(() => {
            const IconComponent = getIconComponent(categoryName);
            return <IconComponent className="w-3 h-3" style={{ color }} />;
          })()}
        </div>
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

  const handleEditClick = async (receipt: Receipt) => {
    try {
      // Always fetch items directly from database when editing
      // This ensures we have the latest data regardless of whether receipt was expanded
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        showToast("Musisz być zalogowany, aby edytować paragon.", "error");
        return;
      }

      const { data: itemsData, error } = await supabase
        .from("items")
        .select("*")
        .eq("receipt_id", receipt.id)
        .eq("user_id", authUser.id);

      if (error) {
        console.error("Error fetching items for edit:", error);
        showToast(
          "Wystąpił błąd podczas pobierania produktów do edycji.",
          "error",
        );
        return;
      }

      // Map the receipt and its items into the ReceiptData structure
      const receiptItems = itemsData || [];
      const formattedData = {
        store_name: receipt.store_name,
        date: receipt.date,
        total_amount: receipt.total_amount,
        category: receipt.category,
        category_id: receipt.category_id || null, // Ensure it's never undefined
        items: receiptItems.map((item) => ({
          name: item.name,
          price: item.price,
          category: item.category, // Use the exact category name from database
          category_id: item.category_id || null, // Ensure it's never undefined
          unit: item.unit || "szt",
          quantity: item.quantity || 1,
          is_bio: isBioProduct(item.name),
        })),
      };

      setEditingReceiptId(receipt.id);
      setReceiptToEdit(formattedData);
    } catch (error) {
      console.error("Error preparing edit data:", error);
      showToast(
        "Wystąpił błąd podczas przygotowywania danych do edycji.",
        "error",
      );
    }
  };

  const handleSaveEdit = async (finalData: {
    store_name: string;
    date: string;
    total_amount: number;
    category: string;
    items: Array<{
      name: string;
      price: number;
      category: string;
      category_id?: string | null;
      unit?: string;
      quantity?: number;
      is_bio?: boolean;
    }>;
  }) => {
    try {
      const receiptId = editingReceiptId;
      if (!receiptId) {
        throw new Error("No receipt ID to edit");
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error("User not authenticated");
      }

      // Update the receipt
      const { error: receiptError } = await supabase
        .from("receipts")
        .update({
          store_name: finalData.store_name,
          date: finalData.date,
          total_amount: finalData.total_amount,
          category: finalData.category,
        })
        .eq("id", receiptId)
        .eq("user_id", authUser.id);

      if (receiptError) throw receiptError;

      // Delete existing items for this receipt
      const { error: deleteError } = await supabase
        .from("items")
        .delete()
        .eq("receipt_id", receiptId)
        .eq("user_id", authUser.id);

      if (deleteError) throw deleteError;

      // Insert new items with all required fields
      if (finalData.items && finalData.items.length > 0) {
        const itemsToInsert = finalData.items.map((item) => ({
          receipt_id: receiptId,
          name: item.name,
          price: item.price,
          category: item.category,
          category_id: item.category_id || null,
          unit: item.unit || "szt",
          quantity: item.quantity || 1,
          is_bio: item.is_bio || false,
          user_id: authUser.id,
        }));

        const { error: insertError } = await supabase
          .from("items")
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      // Clear edit states
      setReceiptToEdit(null);
      setEditingReceiptId(null);

      // Show success message
      showToast("Paragon został pomyślnie zaktualizowany!", "success");

      // Re-fetch receipts to update the UI
      await fetchReceipts();

      // If the edited receipt was expanded, refresh its items to show updated data
      if (expandedReceiptIds.has(receiptId)) {
        await fetchItemsForReceipt(receiptId);
      }
    } catch (error) {
      console.error("Error saving edit:", error);
      showToast("Wystąpił błąd podczas zapisywania zmian.", "error");
    }
  };

  const handleExportCSV = async () => {
    try {
      // Get user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showToast("Musisz być zalogowany, aby wyeksportować dane.", "error");
        return;
      }

      // Get user's subscription tier from profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        showToast(
          "Wystąpił błąd podczas pobierania informacji o subskrypcji.",
          "error",
        );
        return;
      }

      // Check if user has PRO access
      const subscriptionTier = profileData?.subscription_tier || "free";
      if (subscriptionTier === "free") {
        setShowProModal(true);
        return;
      }

      // Fetch all receipts for the user
      const { data: receiptsData, error: receiptsError } = await supabase
        .from("receipts")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (receiptsError) {
        console.error("Error fetching receipts:", receiptsError);
        showToast("Wystąpił błąd podczas pobierania paragonów.", "error");
        return;
      }

      if (!receiptsData || receiptsData.length === 0) {
        showToast("Brak danych do wyeksportowania.", "error");
        return;
      }

      // Fetch all items for the user
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("id, receipt_id, name, price, category")
        .eq("user_id", user.id);

      if (itemsError) {
        console.error("Error fetching items:", itemsError);
        showToast("Wystąpił błąd podczas pobierania produktów.", "error");
        return;
      }

      // Create CSV content with UTF-8 BOM for Polish characters
      let csvContent = "\uFEFF"; // UTF-8 BOM
      csvContent += "Data,Sklep,Produkt,Kategoria,Cena,Czy_BIO\n";

      // Process each receipt and its items
      receiptsData.forEach((receipt) => {
        const receiptItems =
          itemsData?.filter((item) => item.receipt_id === receipt.id) || [];

        if (receiptItems.length === 0) {
          // If no items, add receipt with empty product
          csvContent += `"${receipt.date}","${receipt.store_name}","","${receipt.category}","${receipt.total_amount.toFixed(2)}",""\n`;
        } else {
          // Add each item from the receipt
          receiptItems.forEach((item) => {
            const isBio = isBioProduct(item.name) ? "TAK" : "NIE";
            const price =
              typeof item.price === "number"
                ? item.price.toFixed(2)
                : parseFloat(String(item.price).replace(",", ".")).toFixed(2);

            csvContent += `"${receipt.date}","${receipt.store_name}","${item.name.replace(/"/g, '""')}","${item.category}","${price}","${isBio}"\n`;
          });
        }
      });

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "paragonly_wydatki.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("Eksport zakończony pomyślnie!", "success");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      showToast("Wystąpił błąd podczas eksportowania danych.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paragony</h1>
          <p className="text-muted-foreground">Twoje zapisane paragony</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
        >
          <Download size={16} />
          Eksportuj do CSV
        </button>
      </div>

      {/* Time Filter */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filtry</CardTitle>
            <TimeFilter
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
            />
          </div>
        </CardHeader>
      </Card>

      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <Table className="w-full">
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="text-muted-foreground font-medium text-sm">
                Data
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-sm">
                Sklep
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-sm">
                Ilość pozycji
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-sm">
                Kategoria
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-sm">
                Kwota
              </TableHead>
              <TableHead className="text-muted-foreground font-medium text-sm text-center">
                Akcje
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !hasLoadedOnce ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span>Ładowanie paragonów...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="p-4">
                  <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
                    <p className="text-destructive">{error}</p>
                    <button
                      onClick={fetchReceipts}
                      className="mt-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm"
                    >
                      Spróbuj ponownie
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ) : receipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center">
                  <div className="w-full bg-card border border-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Brak zapisanych paragonów
                    </h3>
                    <p className="text-muted-foreground">
                      Zeskanuj pierwszy paragon, aby go tutaj zobaczyć.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              receipts.map((receipt) => (
                <React.Fragment key={receipt.id}>
                  <TableRow
                    onClick={() => handleToggleReceipt(receipt.id)}
                    className={`border-t border-border hover:bg-muted cursor-pointer transition-colors ${expandedReceiptIds.has(receipt.id) ? "bg-muted" : ""}`}
                  >
                    <TableCell className="px-4 py-3">
                      <div className="text-muted-foreground">
                        {formatDate(receipt.date)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {receipt.store_name}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {itemCounts[receipt.id] || 0}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {renderCategoryBadge(receipt.category)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {receipt.total_amount.toFixed(2)} PLN
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(receipt);
                          }}
                          className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors cursor-pointer"
                          title="Edytuj paragon"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptToDelete(receipt.id);
                          }}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                          title="Usuń paragon"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedReceiptIds.has(receipt.id) && (
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={6} className="p-0">
                        <div className="w-full p-6 space-y-6">
                          <div>
                            <h4 className="font-semibold text-foreground text-lg mb-4">
                              Pozycje na paragonie (
                              {itemsByReceipt[receipt.id]?.length || 0})
                            </h4>

                            {/* Column Headers */}
                            <div className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr] gap-4 text-xs text-muted-foreground font-medium uppercase border-b border-border pb-2 mb-2 px-4">
                              <div>Nazwa</div>
                              <div>Ilość</div>
                              <div>Cena jedn.</div>
                              <div>Kategoria</div>
                              <div className="text-right">Suma</div>
                            </div>

                            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-transparent">
                              {itemsLoading[receipt.id] ? (
                                <div className="text-center py-6 text-muted-foreground">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                                </div>
                              ) : itemsByReceipt[receipt.id]?.length > 0 ? (
                                itemsByReceipt[receipt.id]?.map((item) => {
                                  const isBio = isBioProduct(item.name);
                                  // Calculate unit price and total
                                  const quantity = item.quantity || 1;
                                  const unitPrice = item.price; // item.price is already the unit price
                                  const totalPrice = item.price * quantity; // Calculate total as unit price * quantity

                                  return (
                                    <div
                                      key={item.id}
                                      className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr] gap-4 items-center bg-card border border-border/50 p-4 rounded-lg hover:bg-muted transition-colors"
                                    >
                                      {/* Col 1: Product Name */}
                                      <div className="flex items-center font-medium text-orange-500 cursor-pointer hover:text-orange-400 hover:underline transition-colors">
                                        {item.name}
                                        {isBio && (
                                          <span
                                            className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                                            style={{
                                              backgroundColor:
                                                "hsl(var(--bio-badge-bg))",
                                              color:
                                                "hsl(var(--bio-badge-text))",
                                              borderColor:
                                                "hsl(var(--bio-badge-border))",
                                            }}
                                            title="Produkt BIO"
                                          >
                                            BIO
                                          </span>
                                        )}
                                      </div>

                                      {/* Col 2: Quantity */}
                                      <div className="text-sm text-foreground">
                                        {quantity} szt.
                                      </div>

                                      {/* Col 3: Unit Price */}
                                      <div className="text-sm text-muted-foreground">
                                        {unitPrice.toFixed(2)} zł/szt.
                                      </div>

                                      {/* Col 4: Category with icons */}
                                      <div className="flex items-center gap-2">
                                        {renderCategoryBadge(item.category)}
                                      </div>

                                      {/* Col 5: Total Price */}
                                      <div className="font-semibold text-foreground text-right">
                                        {totalPrice.toFixed(2)} PLN
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
                              onClick={() => handleToggleReceipt(receipt.id)}
                              className="text-orange-500 hover:text-orange-400 text-sm font-medium cursor-pointer"
                            >
                              Ukryj szczegóły
                            </button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal upsell PRO */}
      <ProModalGate
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        title="Funkcja Premium"
        message="Eksport danych do pliku CSV to funkcja Premium. Przejdź na plan PRO, aby pobierać i analizować swoje dane w Excelu."
      />

      {/* Modal edycji paragonu */}
      {receiptToEdit && (
        <ReceiptVerification
          receiptData={receiptToEdit}
          isOpen={true}
          onClose={() => setReceiptToEdit(null)}
          onReject={() => setReceiptToEdit(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Modal usuwania paragonu */}
      {receiptToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setReceiptToDelete(null)} // Zamykanie kliknięciem w tło
        >
          <div
            className="bg-card border border-border/50 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Zapobiega zamykaniu po kliknięciu w sam modal
          >
            {/* Górny kolorowy akcent (opcjonalny, dla lepszego wyglądu) */}
            <div className="h-2 w-full bg-red-500"></div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-500/10 p-3 rounded-full text-red-500">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Usuń paragon
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tej operacji nie można cofnąć
                  </p>
                </div>
              </div>

              <p className="text-foreground/80 mb-6 mt-2">
                Czy na pewno chcesz usunąć ten paragon? Spowoduje to również
                usunięcie
                <span className="font-semibold text-red-400">
                  {" "}
                  wszystkich wydatków{" "}
                </span>
                z nim powiązanych, co wpłynie na Twoje statystyki i stan
                budżetów.
              </p>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReceiptToDelete(null);
                  }}
                  className="px-4 py-2 rounded-lg font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteReceipt(receiptToDelete);
                    setReceiptToDelete(null); // Zamknij modal po akcji
                  }}
                  className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20 transition-all cursor-pointer"
                >
                  Tak, usuń paragon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toastMsg.type === "success"
                ? "bg-green-500/95 text-white"
                : "bg-red-500/95 text-white"
            }`}
          >
            {toastMsg.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <span className="font-medium">{toastMsg.title}</span>
          </div>
        </div>
      )}
    </div>
  );
}
