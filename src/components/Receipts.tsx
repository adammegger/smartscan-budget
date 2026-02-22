import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import ProductPriceHistory from "./ProductPriceHistory";

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
  created_at: string;
}

interface DateFilter {
  startDate: Date | null;
  endDate: Date | null;
  period: "today" | "week" | "month" | "custom";
}

interface ReceiptsProps {
  selectedReceiptId: number | null;
  onReceiptSelect: (id: number | null) => void;
  dateFilter?: DateFilter;
}

export default function Receipts(props: ReceiptsProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemCounts, setItemCounts] = useState<Record<number, number>>({});
  const [showingPriceHistory, setShowingPriceHistory] = useState<string | null>(
    null,
  );

  useEffect(() => {
    fetchReceipts();
  }, [props.dateFilter]);

  // Fetch item counts for all receipts
  useEffect(() => {
    const fetchItemCounts = async () => {
      try {
        const { data, error } = await supabase
          .from("items")
          .select("receipt_id")
          .in(
            "receipt_id",
            receipts.map((r) => r.id),
          );

        if (error) {
          throw error;
        }

        const counts: Record<number, number> = {};
        data?.forEach((item) => {
          counts[item.receipt_id] = (counts[item.receipt_id] || 0) + 1;
        });

        setItemCounts(counts);
      } catch (err) {
        console.error("Error fetching item counts:", err);
      }
    };

    if (receipts.length > 0) {
      fetchItemCounts();
    }
  }, [receipts]);

  const fetchItemsForReceipt = async (receiptId: number) => {
    try {
      setItemsLoading(true);
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("receipt_id", receiptId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      setSelectedItems(data || []);
    } catch (err) {
      console.error("Error fetching items:", err);
      setSelectedItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    if (props.selectedReceiptId) {
      fetchItemsForReceipt(props.selectedReceiptId);
    } else {
      setSelectedItems([]);
    }
  }, [props.selectedReceiptId]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from("receipts").select("*");

      // Apply date filtering if dateFilter is provided
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

      if (error) {
        throw error;
      }

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Food":
        return "bg-green-100 text-green-800";
      case "Transport":
        return "bg-blue-100 text-blue-800";
      case "Home":
        return "bg-yellow-100 text-yellow-800";
      case "Health":
        return "bg-red-100 text-red-800";
      case "Entertainment":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-400">Ładowanie paragonów...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchReceipts}
          className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Brak zapisanych paragonów</p>
        <p className="text-sm mt-2">
          Zeskanuj pierwszy paragon, aby go tutaj zobaczyć
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-300 font-medium text-sm">
                  Data
                </th>
                <th className="text-left px-4 py-3 text-gray-300 font-medium text-sm">
                  Sklep
                </th>
                <th className="text-left px-4 py-3 text-gray-300 font-medium text-sm">
                  Ilość pozycji
                </th>
                <th className="text-left px-4 py-3 text-gray-300 font-medium text-sm">
                  Kategoria
                </th>
                <th className="text-left px-4 py-3 text-gray-300 font-medium text-sm">
                  Kwota
                </th>
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
                    className={`border-t border-zinc-700/50 hover:bg-zinc-800/50 cursor-pointer transition-colors ${
                      props.selectedReceiptId === receipt.id
                        ? "bg-zinc-800/50"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-gray-300">
                        {formatDate(receipt.date)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">
                        {receipt.store_name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">
                        {itemCounts[receipt.id] || 0}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                          receipt.category,
                        )}`}
                      >
                        {receipt.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">
                        {receipt.total_amount.toFixed(2)} PLN
                      </div>
                    </td>
                  </tr>
                  {props.selectedReceiptId === receipt.id && (
                    <tr className="bg-zinc-800/50">
                      <td colSpan={4} className="px-4 py-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-white">
                            Pozycje na paragonie:
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {itemsLoading ? (
                              <div className="text-center py-4 text-gray-400">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                                <span className="mt-2 block">
                                  Ładowanie pozycji...
                                </span>
                              </div>
                            ) : selectedItems.length > 0 ? (
                              selectedItems.map((item) => (
                                <div
                                  key={item.id}
                                  className="grid grid-cols-3 gap-4 bg-zinc-800/50 p-2 rounded border border-zinc-700/50"
                                >
                                  <div className="text-gray-300">
                                    <div
                                      className="font-medium cursor-pointer hover:text-orange-400 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowingPriceHistory(item.name);
                                      }}
                                    >
                                      {item.name}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      1 pozycja
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <span
                                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                                        item.category,
                                      )} whitespace-nowrap`}
                                    >
                                      {item.category}
                                    </span>
                                  </div>
                                  <div className="flex justify-end">
                                    <span className="font-medium text-white">
                                      {item.price.toFixed(2)} PLN
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-400">
                                Brak pozycji na tym paragonie
                              </div>
                            )}
                          </div>
                          {/* Category Summary */}
                          {selectedItems.length > 0 && (
                            <div className="space-y-2 pt-3 border-t border-zinc-700/50">
                              <h5 className="font-semibold text-white text-sm">
                                Podsumowanie według kategorii:
                              </h5>
                              <div className="grid grid-cols-3 gap-2">
                                {(() => {
                                  // Calculate category totals from selectedItems
                                  const categoryTotals = new Map<
                                    string,
                                    number
                                  >();

                                  selectedItems.forEach((item) => {
                                    const currentTotal =
                                      categoryTotals.get(item.category) || 0;
                                    categoryTotals.set(
                                      item.category,
                                      currentTotal + item.price,
                                    );
                                  });

                                  // Convert to array and sort by total amount (descending)
                                  const sortedCategories = Array.from(
                                    categoryTotals.entries(),
                                  ).sort((a, b) => b[1] - a[1]);

                                  return sortedCategories.map(
                                    ([category, total]) => (
                                      <div key={category} className="space-y-1">
                                        <div
                                          className={`p-2 rounded text-xs font-medium ${getCategoryColor(
                                            category,
                                          )}`}
                                        >
                                          {category}
                                        </div>
                                        <div className="text-xs text-gray-300">
                                          {total.toFixed(2)} PLN
                                        </div>
                                      </div>
                                    ),
                                  );
                                })()}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 border-t border-zinc-700/50">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-400">
                                Zapisano:{" "}
                                {format(
                                  new Date(receipt.created_at),
                                  "dd.MM.yyyy HH:mm",
                                  { locale: pl },
                                )}
                              </span>
                            </div>
                            <button
                              onClick={() => props.onReceiptSelect(null)}
                              className="text-orange-400 hover:text-orange-300 text-sm font-medium"
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

      {/* Product Price History Modal */}
      {showingPriceHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <ProductPriceHistory
              productName={showingPriceHistory}
              onClose={() => setShowingPriceHistory(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
