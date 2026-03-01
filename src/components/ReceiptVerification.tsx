import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Save, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "./ui/table";
import { supabase } from "../lib/supabase";
import { isBioProduct } from "../lib/eco";
import { getCategoryId, CATEGORY_IDS } from "../lib/categories";

interface ReceiptItem {
  id?: string;
  name: string;
  price: number;
  category: string;
  category_id: string | null;
  unit: string;
  quantity: number;
  is_bio: boolean;
}

interface ReceiptData {
  store_name: string;
  date: string;
  total_amount: number;
  category: string;
  category_id: string | null;
  items: ReceiptItem[];
}

interface ReceiptVerificationProps {
  receiptData: ReceiptData;
  isOpen: boolean;
  onClose: () => void;
  onReject: () => void;
  onSave: (finalData: ReceiptData) => Promise<void>;
}

interface Category {
  id: string;
  name: string;
}

export default function ReceiptVerification({
  receiptData,
  isOpen,
  onClose,
  onReject,
  onSave,
}: ReceiptVerificationProps) {
  console.log("🔍 ReceiptVerification: Component rendered with:", {
    isOpen,
    receiptData,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [editedData, setEditedData] = useState<ReceiptData>(receiptData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    setEditedData(receiptData);
  }, [receiptData]);

  const fetchCategories = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's categories from Supabase
      const { data: dbCategories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", user.id);

      // If no user categories found, try to get global categories
      let categoriesToUse = dbCategories;
      if (!categoriesToUse || categoriesToUse.length === 0) {
        const { data: globalCategories } = await supabase
          .from("categories")
          .select("id, name")
          .is("user_id", null);
        categoriesToUse = globalCategories;
      }

      // Fallback to default categories if no categories found in database
      if (!categoriesToUse || categoriesToUse.length === 0) {
        categoriesToUse = Object.entries(CATEGORY_IDS).map(([name, id]) => ({
          id,
          name,
        }));
      }

      setCategories(categoriesToUse || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleInputChange = (
    field: keyof ReceiptData,
    value: string | number,
  ) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof ReceiptItem,
    value: string | number | boolean,
  ) => {
    setEditedData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Auto-update category_id when category changes
      if (field === "category") {
        const selectedCategory = categories.find((cat) => cat.name === value);
        newItems[index].category_id = selectedCategory?.id || null;
      }

      // Auto-detect BIO flag when name changes
      if (field === "name" && typeof value === "string") {
        newItems[index].is_bio = isBioProduct(value);
      }

      return {
        ...prev,
        items: newItems,
      };
    });
  };

  const handleAddItem = () => {
    setEditedData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          price: 0,
          category: "Inne",
          category_id: getCategoryId("Inne"),
          unit: "szt",
          quantity: 1,
          is_bio: false,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setEditedData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () => {
    return editedData.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update total amount
      const finalData = {
        ...editedData,
        total_amount: calculateTotal(),
      };

      await onSave(finalData);
      onClose();
    } catch (error) {
      console.error("Error saving receipt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    onReject();
    onClose();
  };

  if (!isOpen || !receiptData) return null;

  const totalAmount = calculateTotal();

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* TŁO: Półprzezroczysty backdrop z najwyższym priorytetem */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onReject}
      />

      {/* KONTENER MODALA: Podniesiony nad tło, zablokowane kliknięcia */}
      <div
        className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500/10 p-3 rounded-full text-orange-500">
              <Save size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Weryfikacja paragonu
              </h2>
              <p className="text-sm text-muted-foreground">
                Przejrzyj i popraw dane przed zapisaniem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Receipt Header Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="store_name" className="text-sm font-medium">
                Sklep
              </Label>
              <Input
                id="store_name"
                value={editedData.store_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("store_name", e.target.value)
                }
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={editedData.date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("date", e.target.value)
                }
                className="bg-background border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Kategoria główna
              </Label>
              <select
                id="category"
                value={editedData.category}
                onChange={(e) => {
                  const selectedCategory = categories.find(
                    (cat) => cat.name === e.target.value,
                  );
                  handleInputChange("category", e.target.value);
                  handleInputChange("category_id", selectedCategory?.id || "");
                }}
                className="w-full px-3 py-2 bg-background border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Produkty
              </h3>
              <Button
                onClick={handleAddItem}
                variant="outline"
                className="gap-2"
              >
                <Plus size={16} />
                Dodaj produkt
              </Button>
            </div>

            <div className="bg-card border border-border/50 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="w-1/3">Nazwa</TableHead>
                    <TableHead className="w-1/6">Cena</TableHead>
                    <TableHead className="w-1/6">Ilość</TableHead>
                    <TableHead className="w-1/6">Kategoria</TableHead>
                    <TableHead className="w-1/6">BIO</TableHead>
                    <TableHead className="w-12">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editedData.items.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell>
                        <Input
                          value={item.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleItemChange(index, "name", e.target.value)
                          }
                          className="bg-background border-border/50"
                          placeholder="Nazwa produktu"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleItemChange(
                              index,
                              "price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="bg-background border-border/50 w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="1"
                          value={item.quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="bg-background border-border/50 w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          value={item.category}
                          onChange={(e) =>
                            handleItemChange(index, "category", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-background border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={item.is_bio}
                          onChange={(e) =>
                            handleItemChange(index, "is_bio", e.target.checked)
                          }
                          className="w-4 h-4 text-green-600 bg-background border-border/50 rounded focus:ring-orange-500"
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              <span>Kategoria paragonu: </span>
              <span className="font-medium text-foreground">
                {editedData.category}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Suma produktów:
              </div>
              <div className="text-2xl font-bold text-foreground">
                {totalAmount.toFixed(2)} PLN
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-border/50 bg-muted/50">
          <Button
            onClick={handleReject}
            variant="outline"
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <XCircle size={16} />
            Odrzuć
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="gap-2 bg-orange-500 hover:bg-orange-600"
          >
            <Save size={16} />
            {isLoading ? "Zapisywanie..." : "Zapisz i zakończ"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
