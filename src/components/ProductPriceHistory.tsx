import React, { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Leaf, AlertTriangle, Info } from "lucide-react";
import {
  fetchAndCacheProductTags,
  NUTRI_SCORE_COLORS,
  NUTRI_SCORE_TEXT_COLORS,
} from "../lib/openfoodfacts";
import type { ProductTags } from "../lib/openfoodfacts";

interface PriceHistoryItem {
  price: number;
  receiptDate: string;
  receiptId?: number;
  storeName?: string;
}

interface StorePrice {
  store_name: string;
  min_price: number;
  date: string;
}

interface ProductPriceHistoryProps {
  initialProduct?: string | null;
}

export default function ProductPriceHistory({
  initialProduct,
}: ProductPriceHistoryProps) {
  const [productList, setProductList] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>(
    initialProduct || "",
  );
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [storePrices, setStorePrices] = useState<StorePrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [productTags, setProductTags] = useState<ProductTags | null>(null);
  const [tagsLoading, setTagsLoading] = useState(false);

  // Refs to prevent infinite loops
  const productListFetchedRef = useRef(false);
  const priceHistoryFetchedRef = useRef(false);

  // Handle initial product - fetch price history when component mounts with initialProduct
  useEffect(() => {
    if (initialProduct && productListFetchedRef.current) {
      // If we have initial product and product list is already loaded, trigger fetch
      priceHistoryFetchedRef.current = false;
    }
  }, [initialProduct]);

  // Helper function to format date
  const formatDate = (dateValue: string | undefined): string => {
    if (!dateValue) return "Brak daty";
    try {
      return format(new Date(dateValue), "dd.MM.yyyy", { locale: pl });
    } catch {
      return "Brak daty";
    }
  };

  // Krok 1: Pobieranie Listy - wykonuje się tylko raz po wejściu w zakładkę
  useEffect(() => {
    const fetchProductList = async () => {
      console.log("Fetching products...");

      try {
        // Get current authenticated user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          productListFetchedRef.current = true;
          return;
        }

        const { data, error } = await supabase
          .from("items")
          .select("name")
          .eq("user_id", authUser.id)
          .order("name", { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          // Get unique product names and sort alphabetically
          const uniqueProducts = Array.from(
            new Set(data.map((item) => item.name)),
          ).sort((a, b) => a.localeCompare(b, "pl"));

          setProductList(uniqueProducts);
          productListFetchedRef.current = true;
        }
      } catch (err) {
        console.error("Error fetching product list:", err);
      }
    };

    // Only fetch if not already fetched
    if (!productListFetchedRef.current) {
      fetchProductList();
    }
  }, []); // Empty dependency array - runs only once

  // Krok 2: Wybór Produktu - obsługa zmiany wybranego produktu
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const product = e.target.value;
    setSelectedProduct(product);

    // Reset price history when product changes
    setPriceHistory([]);
    setStorePrices([]);
    priceHistoryFetchedRef.current = false;
  };

  // Krok 3: Pobieranie Historii - uruchamia się tylko gdy selectedProduct nie jest pusty
  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (!selectedProduct) return;

      console.log("Fetching history for:", selectedProduct);

      try {
        setLoading(true);

        // Get current authenticated user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setPriceHistory([]);
          setStorePrices([]);
          setLoading(false);
          return;
        }

        // SQL query to get price history for the selected product with store info
        const { data, error } = await supabase
          .from("items")
          .select(
            `
            price,
            receipts!fk_items_receipt_id(date, store_name)
          `,
          )
          .eq("name", selectedProduct)
          .eq("user_id", authUser.id)
          .order("date", { foreignTable: "receipts", ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          // Transform data to match our type structure
          const transformedData = data.map(
            (item: {
              price: number;
              receipts?:
                | { date: string; store_name: string }
                | { date: string; store_name: string }[];
            }) => {
              // Extract date and store from nested receipts structure
              const receipts = item.receipts;
              const receiptData = receipts
                ? Array.isArray(receipts)
                  ? receipts[0]
                  : receipts
                : null;

              return {
                price: item.price,
                receiptDate: receiptData?.date || "",
                storeName: receiptData?.store_name || "Nieznany sklep",
              };
            },
          );

          // Sort chronologically (oldest first) for the chart
          const sortedData = transformedData.sort(
            (a, b) =>
              new Date(a.receiptDate).getTime() -
              new Date(b.receiptDate).getTime(),
          );

          console.log("Mapped item", transformedData);
          console.log("Final sorted", sortedData);
          setPriceHistory(sortedData);

          // Calculate store prices (min price per store)
          const storeMap = new Map<string, StorePrice>();
          transformedData.forEach((item) => {
            const storeName = item.storeName || "Nieznany sklep";
            const existing = storeMap.get(storeName);
            if (!existing || item.price < existing.min_price) {
              storeMap.set(storeName, {
                store_name: storeName,
                min_price: item.price,
                date: item.receiptDate,
              });
            }
          });
          setStorePrices(
            Array.from(storeMap.values()).sort(
              (a, b) => a.min_price - b.min_price,
            ),
          );

          priceHistoryFetchedRef.current = true;
        }
      } catch (err) {
        console.error("Error fetching price history:", err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if product is selected and not already fetched for this product
    if (selectedProduct && !priceHistoryFetchedRef.current) {
      fetchPriceHistory();
    }
  }, [selectedProduct]); // Depends only on selectedProduct

  // Fetch product tags when a product is selected
  useEffect(() => {
    const fetchTags = async () => {
      if (!selectedProduct) {
        setProductTags(null);
        return;
      }

      try {
        setTagsLoading(true);
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setProductTags(null);
          setTagsLoading(false);
          return;
        }

        const tags = await fetchAndCacheProductTags(
          selectedProduct,
          supabase,
          authUser.id,
        );
        setProductTags(tags);
      } catch (err) {
        console.error("Error fetching product tags:", err);
      } finally {
        setTagsLoading(false);
      }
    };

    fetchTags();
  }, [selectedProduct]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (priceHistory.length === 0) return null;

    const prices = priceHistory.map((item) => item.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    const minItem = priceHistory.find((item) => item.price === minPrice);
    const maxItem = priceHistory.find((item) => item.price === maxPrice);

    const lastPrice = priceHistory[priceHistory.length - 1]?.price || 0;
    const trend =
      lastPrice > avgPrice ? "up" : lastPrice < avgPrice ? "down" : "stable";

    return {
      minPrice,
      maxPrice,
      avgPrice,
      minDate: minItem?.receiptDate,
      minStore: minItem?.storeName,
      maxDate: maxItem?.receiptDate,
      lastPrice,
      trend,
    };
  }, [priceHistory]);

  // Prepare chart data (chronological order)
  const chartData = useMemo(() => {
    return priceHistory.map((item) => ({
      date: formatDate(item.receiptDate),
      price: item.price,
      store: item.storeName,
    }));
  }, [priceHistory]);

  // Chart colors based on theme
  const chartColors = {
    grid: "#e2e8f0",
    axis: "#64748b",
    axisTick: "#94a3b8",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e2e8f0",
    tooltipText: "#1e293b",
    tooltipLabel: "#64748b",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Analiza Cen
      </h3>

      {/* Wybór Produktu */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Wybierz produkt do analizy:
        </label>
        <select
          value={selectedProduct}
          onChange={handleProductChange}
          className="w-full px-3 py-2 bg-white dark:bg-zinc-800/50 border border-slate-300 dark:border-zinc-700/50 rounded-md text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-slate-400 dark:focus:border-zinc-600/50"
        >
          <option value="">-- Wybierz produkt --</option>
          {productList.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
      </div>

      {/* Product Tags - Nutri-Score and Warnings */}
      {(productTags || tagsLoading) && (
        <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
          {tagsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              <span>Pobieranie informacji o produkcie...</span>
            </div>
          ) : productTags ? (
            <div className="space-y-4">
              {/* Nutri-Score Display */}
              {productTags.nutriscore && productTags.nutriscore !== "N/A" && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground font-medium">
                    Nutri-Score:
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold text-white ${
                      NUTRI_SCORE_COLORS[
                        productTags.nutriscore?.toLowerCase() || ""
                      ] || "bg-gray-400"
                    }`}
                  >
                    {productTags.nutriscore?.toUpperCase()}
                  </div>
                </div>
              )}

              {/* BIO Badge */}
              {productTags.isBio && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Leaf size={20} />
                  <span className="font-medium">Produkt BIO</span>
                </div>
              )}

              {/* Macronutrients */}
              {((productTags.protein || 0) > 0 ||
                (productTags.fat || 0) > 0 ||
                (productTags.carbs || 0) > 0) && (
                <div>
                  <div className="text-sm text-muted-foreground font-medium mb-2">
                    Wartość odżywcza (na 100g):
                  </div>
                  <div className="space-y-2">
                    {/* Protein */}
                    {(productTags.protein || 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-16 text-muted-foreground">
                          Białko
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min(productTags.protein || 0, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs w-12 text-right">
                          {(productTags.protein || 0).toFixed(1)}g
                        </span>
                      </div>
                    )}
                    {/* Fat */}
                    {(productTags.fat || 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-16 text-muted-foreground">
                          Tłuszcze
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full"
                            style={{
                              width: `${Math.min(productTags.fat || 0, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs w-12 text-right">
                          {(productTags.fat || 0).toFixed(1)}g
                        </span>
                      </div>
                    )}
                    {/* Carbs */}
                    {(productTags.carbs || 0) > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-16 text-muted-foreground">
                          Węglowodany
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{
                              width: `${Math.min(productTags.carbs || 0, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs w-12 text-right">
                          {(productTags.carbs || 0).toFixed(1)}g
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {(productTags.nutriscore === "D" ||
                productTags.nutriscore === "E" ||
                productTags.isHighSalt ||
                productTags.isHighSugar ||
                productTags.isHighFat) && (
                <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    {productTags.nutriscore === "D" ||
                    productTags.nutriscore === "E"
                      ? "Produkt odradzany w dużych ilościach. "
                      : ""}
                    {productTags.isHighSalt && "Wysoka zawartość soli. "}
                    {productTags.isHighSugar && "Wysoka zawartość cukru. "}
                    {productTags.isHighFat &&
                      "Wysoka zawartość tłuszczu nasyconego."}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Brak informacji o produkcie w bazie OpenFoodFacts
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff7043] mx-auto"></div>
          <p className="text-muted-foreground mt-2">Ładowanie danych...</p>
        </div>
      )}

      {/* No product selected */}
      {!selectedProduct && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Wybierz produkt, aby zobaczyć analizę cen</p>
        </div>
      )}

      {/* Statistics Pills */}
      {stats && priceHistory.length > 0 && (
        <div className="mb-6">
          {/* Main stats row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Min Price - pastel green for light, original for dark */}
            <div className="bg-emerald-50 dark:bg-green-500/10 border border-emerald-200 dark:border-green-500/30 rounded-lg p-4">
              <div className="text-xs text-emerald-700 dark:text-green-400 font-medium mb-1">
                Najniższa cena
              </div>
              <div className="text-xl font-bold text-emerald-700 dark:text-green-400">
                {stats.minPrice.toFixed(2)} PLN
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(stats.minDate)} • {stats.minStore}
              </div>
            </div>

            {/* Max Price - pastel red for light, original for dark */}
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
              <div className="text-xs text-red-700 dark:text-red-400 font-medium mb-1">
                Najwyższa cena
              </div>
              <div className="text-xl font-bold text-red-700 dark:text-red-400">
                {stats.maxPrice.toFixed(2)} PLN
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(stats.maxDate)}
              </div>
            </div>

            {/* Average Price - pastel blue for light, original for dark */}
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
              <div className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">
                Średnia cena
              </div>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-400">
                {stats.avgPrice.toFixed(2)} PLN
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                Ostatnia: {stats.lastPrice.toFixed(2)} PLN
                {stats.trend === "up" && (
                  <span className="text-red-600 dark:text-red-400">
                    ↑ wyższa
                  </span>
                )}
                {stats.trend === "down" && (
                  <span className="text-green-600 dark:text-green-400">
                    ↓ niższa
                  </span>
                )}
                {stats.trend === "stable" && (
                  <span className="text-muted-foreground">= równa</span>
                )}
              </div>
            </div>
          </div>

          {/* Line Chart */}
          {chartData.length > 0 && (
            <div className="bg-muted rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">
                Wykres cen w czasie
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.grid}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={chartColors.axis}
                    tick={{ fill: chartColors.axisTick, fontSize: 12 }}
                    tickLine={{ stroke: chartColors.grid }}
                  />
                  <YAxis
                    stroke={chartColors.axis}
                    tick={{ fill: chartColors.axisTick, fontSize: 12 }}
                    tickLine={{ stroke: chartColors.grid }}
                    tickFormatter={(value) => `${value.toFixed(2)}`}
                    domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: "8px",
                      color: chartColors.tooltipText,
                    }}
                    labelStyle={{ color: chartColors.tooltipLabel }}
                    formatter={(value) => [
                      `${Number(value).toFixed(2)} PLN`,
                      "Cena",
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#ff7043"
                    strokeWidth={2}
                    dot={{ fill: "#ff7043", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#ff7043" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Best Prices by Store */}
          {storePrices.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Najlepsza cena w sklepach
              </h4>
              <div className="space-y-2">
                {storePrices.map((store, index) => (
                  <div
                    key={store.store_name}
                    className="flex items-center justify-between bg-muted rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <span className="text-foreground font-medium">
                        {store.store_name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#ff7043] dark:text-[#ff7043] font-bold">
                        {store.min_price.toFixed(2)} PLN
                      </span>
                      <span className="text-muted-foreground text-xs ml-2">
                        ({formatDate(store.date)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state for product with no history */}
      {selectedProduct && !loading && priceHistory.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Brak danych cenowych dla tego produktu</p>
        </div>
      )}
    </div>
  );
}
