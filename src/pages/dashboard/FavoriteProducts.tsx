import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { getCategoryColor, getCategoryIcon } from "../../lib/categoryCache";
import { ShoppingCart, Star, Calendar, Edit, Save, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import CategoryIcon from "../../components/CategoryIcon";
import { isBioProduct } from "../../lib/eco";
import { useDataCache, useCacheValid } from "../../lib/cacheUtils";
import { useRefresh } from "../../lib/refreshContext";

// Format currency function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(amount);
};

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  user_id: string | null;
}

interface FavoriteProductLocal {
  id: string;
  name: string;
  category: string;
  category_id: string | null;
  count: number;
  totalSpent: number;
  avgPrice: number;
  lastPurchased: Date;
}

export default function FavoriteProducts() {
  const [timeFilter] = useState<"today" | "week" | "month" | "year" | "all">(
    "month",
  );
  const [sortBy, setSortBy] = useState<"count" | "totalSpent" | "name">(
    "count",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [favoriteProducts, setFavoriteProducts] = useState<
    FavoriteProductLocal[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Data cache
  const { favoriteProductCache, setFavoriteProductCache } = useDataCache();
  const isCacheValid = useCacheValid(favoriteProductCache);

  // Use refresh context to listen for refresh triggers
  const { refreshKey } = useRefresh();

  // Fetch favorite products from Supabase
  const fetchFavoriteProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }

      // Calculate start date based on time filter
      let startDate: Date | null = null;
      const now = new Date();

      switch (timeFilter) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate(),
          );
          break;
        case "year":
          startDate = new Date(
            now.getFullYear() - 1,
            now.getMonth(),
            now.getDate(),
          );
          break;
        case "all":
          startDate = null;
          break;
      }

      // Build date filter
      let receiptsQuery = supabase
        .from("receipts")
        .select("id, date")
        .eq("user_id", authUser.id);

      if (startDate) {
        receiptsQuery = receiptsQuery.gte(
          "date",
          startDate.toISOString().split("T")[0],
        );
      }

      const { data: filteredReceipts, error: receiptsError } =
        await receiptsQuery;

      if (receiptsError) throw receiptsError;

      const receiptIds = filteredReceipts?.map((receipt) => receipt.id) || [];

      if (receiptIds.length === 0) {
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }

      // Fetch items and group by product name
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("name, price, category")
        .eq("user_id", authUser.id)
        .in("receipt_id", receiptIds);

      if (itemsError) throw itemsError;

      if (!items || items.length === 0) {
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }

      // Group items by product name and calculate statistics
      const productMap = new Map<
        string,
        {
          name: string;
          category: string;
          count: number;
          totalSpent: number;
          lastPurchased: Date;
        }
      >();

      items.forEach((item) => {
        const productName = item.name?.trim();
        if (!productName) return;

        const price =
          typeof item.price === "number"
            ? item.price
            : parseFloat(String(item.price).replace(",", "."));

        if (productMap.has(productName)) {
          const existing = productMap.get(productName)!;
          productMap.set(productName, {
            ...existing,
            count: existing.count + 1,
            totalSpent: existing.totalSpent + price,
            lastPurchased: new Date(), // We'll update this later
          });
        } else {
          productMap.set(productName, {
            name: productName,
            category: item.category,
            count: 1,
            totalSpent: price,
            lastPurchased: new Date(),
          });
        }
      });

      // Convert to array and calculate additional statistics
      const products: FavoriteProductLocal[] = Array.from(
        productMap.values(),
      ).map((product) => ({
        id: product.name.toLowerCase().replace(/\s+/g, "-"),
        name: product.name,
        category: product.category,
        category_id: null, // We don't have category_id in items table
        count: product.count,
        totalSpent: product.totalSpent,
        avgPrice: product.totalSpent / product.count,
        lastPurchased: product.lastPurchased,
      }));

      // Sort by count descending by default
      products.sort((a, b) => b.count - a.count);

      setFavoriteProducts(products);

      // Store in cache
      setFavoriteProductCache({
        products,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error("Error fetching favorite products:", err);
      setError("Wystąpił błąd podczas pobierania ulubionych produktów");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteProducts();
  }, [timeFilter]);

  // Initialize with cached data if available
  useEffect(() => {
    if (favoriteProductCache && isCacheValid) {
      setFavoriteProducts(favoriteProductCache.products);
      setLoading(false);
    } else {
      fetchFavoriteProducts();
    }
  }, [favoriteProductCache, isCacheValid, refreshKey]);

  // Listen for global receiptAdded event to refresh data
  useEffect(() => {
    const handleReceiptAdded = () => {
      fetchFavoriteProducts();
    };

    window.addEventListener("receiptAdded", handleReceiptAdded);
    return () => window.removeEventListener("receiptAdded", handleReceiptAdded);
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

  // Filter and sort data based on current filters
  const filteredData = useMemo(() => {
    const filtered = [...favoriteProducts];

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "count") {
        comparison = a.count - b.count;
      } else if (sortBy === "totalSpent") {
        comparison = a.totalSpent - b.totalSpent;
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [favoriteProducts, sortBy, sortOrder]);

  const handleSort = (newSortBy: "count" | "totalSpent" | "name") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (column: "count" | "totalSpent" | "name") => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  // Function to update category for a product
  const updateProductCategory = async (
    productName: string,
    newCategory: string,
  ) => {
    try {
      setIsUpdating(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Update all items with this product name to the new category
      const { error } = await supabase
        .from("items")
        .update({ category: newCategory })
        .eq("user_id", user.id)
        .ilike("name", productName);

      if (error) throw error;

      // Update local state directly instead of re-fetching
      setFavoriteProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.name === productName
            ? { ...product, category: newCategory }
            : product,
        ),
      );

      // Close edit mode
      setEditingProduct(null);
      setNewCategory("");
    } catch (err) {
      console.error("Error updating product category:", err);
      setError("Wystąpił błąd podczas aktualizacji kategorii produktu");
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to render colorful category badge with edit button
  const renderCategoryBadge = (categoryName: string, productName: string) => {
    const color = getCategoryColor(categoryName);
    const icon = getCategoryIcon(categoryName);

    if (editingProduct === productName) {
      return (
        <div className="flex items-center gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="text-xs border border-border/50 rounded px-2 py-1 bg-background"
            disabled={isUpdating}
          >
            <option value="">Wybierz kategorię...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                updateProductCategory(productName, newCategory);
              }}
              disabled={!newCategory || isUpdating}
              className="p-1 text-green-600 hover:bg-green-500/10 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditingProduct(null);
                setNewCategory("");
              }}
              disabled={isUpdating}
              className="p-1 text-destructive hover:bg-destructive/10 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <CategoryIcon icon={icon} color={color} size={12} />
          {categoryName}
        </span>
        <button
          onClick={() => {
            setEditingProduct(productName);
            setNewCategory(categoryName);
          }}
          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors cursor-pointer"
          title="Edytuj kategorię"
        >
          <Edit size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* PRO Banner */}
      {/* <Card className="border-none bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-orange-500" />
              <div>
                <h3 className="font-semibold text-orange-600 dark:text-orange-400">
                  ✨ AI Asystent: Generuj przepisy i listy zakupów
                </h3>
                <p className="text-sm text-muted-foreground">
                  Wkrótce w planie PRO
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
            >
              Zapisz się na listę oczekujących
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Ulubione produkty
          </h1>
          <p className="text-muted-foreground">
            Produkty, które najczęściej kupujesz
          </p>
        </div>
        {/* <div className="flex items-center gap-2">
          <Calendar size={20} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Ostatnie zakupy</span>
        </div> */}
      </div>

      {/* Time Filter */}
      {/* <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filtry</CardTitle>
            <TimeFilter
              timeFilter={timeFilter}
              onTimeFilterChange={setTimeFilter}
            />
          </div>
        </CardHeader>
      </Card> */}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Statystyki zakupów</CardTitle>
            <div className="text-sm text-muted-foreground">
              {loading ? "Ładowanie..." : `${filteredData.length} produktów`}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                <span>Ładowanie danych...</span>
              </div>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4">
              <p className="text-destructive">{error}</p>
              <button
                onClick={fetchFavoriteProducts}
                className="mt-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm"
              >
                Spróbuj ponownie
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th
                        className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort("name")}
                      >
                        Produkt {getSortIcon("name")}
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort("count")}
                      >
                        Ilość zakupów {getSortIcon("count")}
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => handleSort("totalSpent")}
                      >
                        Wydano łącznie {getSortIcon("totalSpent")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Kategoria
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Średnia cena
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                        Ostatni zakup
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((product) => (
                      <tr
                        key={product.id}
                        className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-2 rounded-lg">
                              <ShoppingCart
                                size={16}
                                className="text-orange-500"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-foreground flex items-center">
                                {product.name}
                                {isBioProduct(product.name) && (
                                  <span
                                    className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                                    style={{
                                      backgroundColor:
                                        "hsl(var(--bio-badge-bg))",
                                      color: "hsl(var(--bio-badge-text))",
                                      borderColor:
                                        "hsl(var(--bio-badge-border))",
                                    }}
                                    title="Produkt BIO"
                                  >
                                    BIO
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Star size={16} className="text-yellow-500" />
                            <span className="font-semibold">
                              {product.count}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              x
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(product.totalSpent)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {renderCategoryBadge(product.category, product.name)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-muted-foreground">
                            {formatCurrency(product.avgPrice)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground">
                            {product.lastPurchased.toLocaleDateString("pl-PL")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Brak danych dla wybranego okresu
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {filteredData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Najczęściej kupowany
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-3 rounded-lg">
                  <Star size={24} className="text-green-500" />
                </div>
                <div>
                  <div className="font-semibold">{filteredData[0].name}</div>
                  <div className="text-sm text-muted-foreground">
                    {filteredData[0].count} zakupów •{" "}
                    {formatCurrency(filteredData[0].totalSpent)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Najwięcej wydano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-3 rounded-lg">
                  <ShoppingCart size={24} className="text-orange-500" />
                </div>
                <div>
                  <div className="font-semibold">
                    {
                      filteredData.reduce((prev, current) =>
                        prev.totalSpent > current.totalSpent ? prev : current,
                      ).name
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(
                      filteredData.reduce((prev, current) =>
                        prev.totalSpent > current.totalSpent ? prev : current,
                      ).totalSpent,
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Łącznie wydano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3 rounded-lg">
                  <Calendar size={24} className="text-purple-500" />
                </div>
                <div>
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(
                      filteredData.reduce(
                        (sum, product) => sum + product.totalSpent,
                        0,
                      ),
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    na {filteredData.length} produktów
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
