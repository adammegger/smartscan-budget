import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function ProductPriceHistory() {
  const [productList, setProductList] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [priceHistory, setPriceHistory] = useState<
    Array<{ price: number; receiptDate: string }>
  >([]);
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
          setLoading(false);
          return;
        }

        // SQL query to get price history for the selected product
        // Using join to get date from receipts table instead of created_at
        const { data, error } = await supabase
          .from("items")
          .select(
            `
            price,
            receipts!fk_items_receipt_id(date)
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
              receipts?: { date: string } | { date: string }[];
            }) => {
              // Extract date from nested receipts structure
              const receipts = item.receipts;
              const rawDate = receipts
                ? Array.isArray(receipts)
                  ? receipts[0]?.date
                  : receipts.date
                : undefined;

              return {
                price: item.price,
                receiptDate: rawDate || "",
              };
            },
          );

          // Sort manually - newest dates first (descending order)
          const sortedData = transformedData.sort(
            (a, b) =>
              new Date(b.receiptDate).getTime() -
              new Date(a.receiptDate).getTime(),
          );

          console.log("Mapped item", transformedData);
          console.log("Final sorted", sortedData);
          setPriceHistory(sortedData);
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

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-4">Historia Cen</h3>

      {/* Krok 2: Wybór Produktu */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Wybierz produkt:
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

      {/* Krok 3: Wyświetlanie Historii */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Ładowanie historii cen...</p>
        </div>
      )}

      {priceHistory.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-semibold text-white mb-2">
            Historia cen dla: {selectedProduct}
          </h4>
          <div className="bg-zinc-800/50 p-4 rounded-lg">
            <p className="text-gray-300">
              Znaleziono {priceHistory.length} wpisów historii cen
            </p>
            <div className="mt-2 space-y-1">
              {priceHistory.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {formatDate(item.receiptDate)}
                  </span>
                  <span className="text-white font-medium">
                    {item.price} PLN
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
