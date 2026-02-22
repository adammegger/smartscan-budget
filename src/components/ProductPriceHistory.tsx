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

export default function ProductPriceHistory() {
  const [productList, setProductList] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([]);
  const [storePrices, setStorePrices] = useState<StorePrice[]>([]);
  const [loading, setLoading] = useState(false);

  // Refs to prevent infinite loops
  const productListFetchedRef = useRef(false);
  const priceHistoryFetchedRef = useRef(false);

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

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-4">Analiza Cen</h3>

      {/* Wybór Produktu */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Wybierz produkt do analizy:
        </label>
        <select
          value={selectedProduct}
          onChange={handleProductChange}
          className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-zinc-600/50"
        >
          <option value="">-- Wybierz produkt --</option>
          {productList.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Ładowanie danych...</p>
        </div>
      )}

      {/* No product selected */}
      {!selectedProduct && !loading && (
        <div className="text-center py-8 text-gray-400">
          <p>Wybierz produkt, aby zobaczyć analizę cen</p>
        </div>
      )}

      {/* Statistics Pills */}
      {stats && priceHistory.length > 0 && (
        <div className="mb-6">
          {/* Main stats row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Min Price */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-xs text-green-400 font-medium mb-1">
                Najniższa cena
              </div>
              <div className="text-xl font-bold text-green-400">
                {stats.minPrice.toFixed(2)} PLN
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {formatDate(stats.minDate)} • {stats.minStore}
              </div>
            </div>

            {/* Max Price */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="text-xs text-red-400 font-medium mb-1">
                Najwyższa cena
              </div>
              <div className="text-xl font-bold text-red-400">
                {stats.maxPrice.toFixed(2)} PLN
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {formatDate(stats.maxDate)}
              </div>
            </div>

            {/* Average Price */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-xs text-blue-400 font-medium mb-1">
                Średnia cena
              </div>
              <div className="text-xl font-bold text-blue-400">
                {stats.avgPrice.toFixed(2)} PLN
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                Ostatnia: {stats.lastPrice.toFixed(2)} PLN
                {stats.trend === "up" && (
                  <span className="text-red-400">↑ wyższa</span>
                )}
                {stats.trend === "down" && (
                  <span className="text-green-400">↓ niższa</span>
                )}
                {stats.trend === "stable" && (
                  <span className="text-gray-400">= równa</span>
                )}
              </div>
            </div>
          </div>

          {/* Line Chart */}
          {chartData.length > 0 && (
            <div className="bg-zinc-800/30 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-4">
                Wykres cen w czasie
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    tickLine={{ stroke: "#3f3f46" }}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    tickLine={{ stroke: "#3f3f46" }}
                    tickFormatter={(value) => `${value.toFixed(2)}`}
                    domain={["dataMin - 0.5", "dataMax + 0.5"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#27272a",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                      color: "#fafafa",
                    }}
                    labelStyle={{ color: "#a1a1aa" }}
                    formatter={(value) => [
                      `${Number(value).toFixed(2)} PLN`,
                      "Cena",
                    ]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#f97316" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Best Prices by Store */}
          {storePrices.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Najlepsza cena w sklepach
              </h4>
              <div className="space-y-2">
                {storePrices.map((store, index) => (
                  <div
                    key={store.store_name}
                    className="flex items-center justify-between bg-zinc-800/30 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-500 w-6">
                        #{index + 1}
                      </span>
                      <span className="text-white font-medium">
                        {store.store_name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-orange-400 font-bold">
                        {store.min_price.toFixed(2)} PLN
                      </span>
                      <span className="text-gray-500 text-xs ml-2">
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
        <div className="text-center py-8 text-gray-400">
          <p>Brak danych cenowych dla tego produktu</p>
        </div>
      )}
    </div>
  );
}
