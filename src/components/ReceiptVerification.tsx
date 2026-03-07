import React, { useState, useEffect, useRef } from "react";
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
import {
  getCategoryId,
  CATEGORY_IDS,
  determineReceiptCategory,
} from "../lib/categories";
import type { ReceiptData } from "../lib/receiptVerification";

interface ReceiptItem {
  id?: string;
  name: string;
  price: string | number;
  category: string;
  category_id: string | null;
  unit: string;
  quantity: number;
  is_bio: boolean;
  isTypingPrice?: boolean;
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

// Autocomplete component for product names
interface ProductSuggestion {
  name: string;
  category: string;
  category_id: string | null;
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onProductSelect?: (product: ProductSuggestion) => void;
  suggestions: ProductSuggestion[];
  placeholder?: string;
  className?: string;
}

// Portal-based dropdown component to avoid overflow clipping
interface DropdownPortalProps {
  isOpen: boolean;
  highlightedIndex: number;
  filteredSuggestions: ProductSuggestion[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSuggestionMouseDown: (suggestion: ProductSuggestion) => void;
}

const DropdownPortal: React.FC<DropdownPortalProps> = ({
  isOpen,
  highlightedIndex,
  filteredSuggestions,
  inputRef,
  onSuggestionMouseDown,
}) => {
  // Use useEffect to calculate position after render to avoid accessing refs during render
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || filteredSuggestions.length === 0 || !inputRef.current) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => setPosition(null), 0);
      return;
    }

    // Calculate position relative to input
    const inputRect = inputRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    setPosition({
      top: inputRect.bottom + scrollTop,
      left: inputRect.left + scrollLeft,
      width: inputRect.width,
    });
  }, [isOpen, filteredSuggestions.length, inputRef]);

  if (!isOpen || filteredSuggestions.length === 0 || !position) {
    return null;
  }

  return createPortal(
    <ul
      className="fixed z-[99999] bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        minWidth: 200,
      }}
    >
      {filteredSuggestions.map((suggestion, index) => (
        <li
          key={suggestion.name}
          className={`px-3 py-2 cursor-pointer text-sm hover:bg-muted ${
            index === highlightedIndex ? "bg-muted" : ""
          }`}
          onMouseDown={() => onSuggestionMouseDown(suggestion)}
        >
          <div className="flex justify-between items-center">
            <span>{suggestion.name}</span>
            <span className="text-xs text-muted-foreground">
              {suggestion.category}
            </span>
          </div>
        </li>
      ))}
    </ul>,
    document.body,
  );
};

const Autocomplete: React.FC<AutocompleteProps> = ({
  value,
  onChange,
  onProductSelect,
  suggestions,
  placeholder = "Nazwa produktu",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input value
  const filteredSuggestions = suggestions.filter((suggestion) =>
    suggestion.name.toLowerCase().includes(value.toLowerCase()),
  );

  // Handle input focus
  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input blur with delay to allow clicking on suggestions
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredSuggestions.length
        ) {
          const selectedProduct = filteredSuggestions[highlightedIndex];
          onChange(selectedProduct.name);
          onProductSelect?.(selectedProduct);
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle suggestion mouse down (to prevent blur interference)
  const handleSuggestionMouseDown = (suggestion: ProductSuggestion) => {
    onChange(suggestion.name);
    onProductSelect?.(suggestion);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle container click to prevent closing when clicking on suggestions
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef} onClick={handleContainerClick}>
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        className={`bg-background border-border/50 ${className}`}
        placeholder={placeholder}
      />

      <DropdownPortal
        isOpen={isOpen}
        highlightedIndex={highlightedIndex}
        filteredSuggestions={filteredSuggestions}
        inputRef={inputRef}
        onSuggestionMouseDown={handleSuggestionMouseDown}
      />
    </div>
  );
};

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
  const [productNames, setProductNames] = useState<ProductSuggestion[]>([]);
  const [editedData, setEditedData] = useState<ReceiptData>(receiptData);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryError, setShowCategoryError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchProductNames();
    }
  }, [isOpen]);

  useEffect(() => {
    setEditedData(receiptData);
  }, [receiptData]);

  // Auto-calculate receipt category based on items
  useEffect(() => {
    if (!editedData.items || editedData.items.length === 0) return;

    // Determine the main category based on items
    const autoCategory = determineReceiptCategory(
      editedData.items.map((item) => {
        const price =
          typeof item.price === "string"
            ? parseFloat(item.price) || 0
            : item.price;
        return {
          category: item.category,
          price: price * item.quantity, // Use total price for the item
        };
      }),
    );

    // Only update if the category is different from what would be auto-calculated
    // This prevents unnecessary updates when the category is already correct
    const currentCategory = editedData.category;

    // If the current category is the same as what would be auto-calculated, don't update
    if (currentCategory === autoCategory) return;

    // Auto-update the category whenever items change
    // Find the exact category from the available categories list
    const matchedCategory = categories.find((cat) => cat.name === autoCategory);

    // If we found an exact match in the categories list, use its ID
    // Otherwise, fall back to the default category ID mapping
    const newCategoryId =
      matchedCategory?.id || getCategoryId(autoCategory) || null;

    setEditedData((prev) => ({
      ...prev,
      category: autoCategory,
      category_id: newCategoryId,
    }));
  }, [editedData.items, categories]);

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

      // Ensure "Mieszane" category is always available for mixed receipts
      // Check if "Mieszane" exists in the categories list
      const hasMieszane = categoriesToUse.some(
        (cat) => cat.name === "Mieszane",
      );

      // If "Mieszane" doesn't exist, add it using the default ID mapping
      if (!hasMieszane) {
        const mieszaneId = getCategoryId("Mieszane");
        if (mieszaneId) {
          categoriesToUse = [
            ...categoriesToUse,
            { id: mieszaneId, name: "Mieszane" },
          ];
        }
      }

      setCategories(categoriesToUse || []);
      console.log("Pobrane kategorie do modala:", categoriesToUse);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProductNames = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch distinct product names with their most recent category from user's items
      const { data, error } = await supabase
        .from("items")
        .select("name, category, category_id")
        .eq("user_id", user.id)
        .not("name", "is", null)
        .order("name", { ascending: true });

      if (error) throw error;

      // Create a map to store the most recent category for each product
      const productMap = new Map<string, ProductSuggestion>();

      // Process items to get the most recent category for each product
      data?.forEach((item) => {
        const productName = item.name?.trim();
        if (!productName) return;

        // If we haven't seen this product before, or if this item is more recent, update it
        if (!productMap.has(productName)) {
          productMap.set(productName, {
            name: productName,
            category: item.category || "Inne",
            category_id: item.category_id || getCategoryId("Inne"),
          });
        }
      });

      // Convert map to array and sort by name
      const productSuggestions = Array.from(productMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      setProductNames(productSuggestions);
      console.log("Pobrane nazwy produktów z kategoriami:", productSuggestions);
    } catch (error) {
      console.error("Error fetching product names:", error);
    }
  };

  const handleInputChange = (
    field: keyof ReceiptData,
    value: string | number | null,
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
    return editedData.items.reduce((total, item) => {
      const price =
        typeof item.price === "string"
          ? parseFloat(item.price) || 0
          : item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const handleSave = async () => {
    // Validate main category is selected - check for empty, null, undefined, or placeholder value
    if (
      !editedData.category_id ||
      editedData.category_id === "" ||
      editedData.category_id === null ||
      editedData.category === "" ||
      editedData.category === null ||
      editedData.category === "Wybierz kategorię..." ||
      editedData.category === "Wybierz kategorię"
    ) {
      setShowCategoryError(true);
      return; // PRZERWIJ ZAPIS!
    }

    setShowCategoryError(false);
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
            <div className="space-y-1">
              <Label htmlFor="category" className="text-sm font-medium">
                Kategoria główna <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                value={editedData.category_id || ""}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const matchedCategory = categories.find(
                    (c) => c.id === selectedId,
                  );

                  handleInputChange("category_id", selectedId);
                  handleInputChange(
                    "category",
                    matchedCategory
                      ? matchedCategory.name
                      : editedData.category,
                  );
                  setShowCategoryError(false); // Ukryj błąd po dokonaniu wyboru
                }}
                className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer ${
                  showCategoryError
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-border/50"
                }`}
              >
                <option value="" disabled>
                  Wybierz kategorię...
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {showCategoryError && (
                <span className="text-xs text-red-500">
                  Kategoria jest wymagana do zapisu.
                </span>
              )}
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
                    <TableHead className="w-1/8">Ilość</TableHead>
                    <TableHead className="w-1/8">Jednostka</TableHead>
                    <TableHead className="w-1/6">Kategoria</TableHead>
                    <TableHead className="w-1/6">BIO</TableHead>
                    <TableHead className="w-12">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editedData.items.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell>
                        <Autocomplete
                          value={item.name}
                          onChange={(value) =>
                            handleItemChange(index, "name", value)
                          }
                          onProductSelect={(product) => {
                            // Auto-fill category when product is selected from autocomplete
                            const selectedCategory = categories.find(
                              (cat) => cat.name === product.category,
                            );

                            setEditedData((prev) => {
                              const newItems = [...prev.items];
                              newItems[index] = {
                                ...newItems[index],
                                name: product.name,
                                category: product.category,
                                category_id:
                                  selectedCategory?.id || product.category_id,
                              };
                              return {
                                ...prev,
                                items: newItems,
                              };
                            });
                          }}
                          suggestions={productNames}
                          placeholder="Nazwa produktu"
                          className="bg-background border-border/50"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          value={item.price}
                          onChange={(e) => {
                            // 1. Get raw string, replace comma with dot
                            const val = e.target.value.replace(",", ".");

                            // 2. Validate format: only digits, optional single dot, up to 2 decimal places
                            // This Regex allows: "", "1", "1.", "1.2", "1.23", "0.5" etc.
                            if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                              handleItemChange(index, "price", val);
                            }
                          }}
                          className="w-full px-2 py-1 bg-muted border border-border rounded text-sm text-right"
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          value={item.quantity}
                          onChange={(e) => {
                            // 1. Get raw string, replace comma with dot
                            const val = e.target.value.replace(",", ".");

                            // 2. Validate format: only digits, optional single dot, up to 2 decimal places
                            // This Regex allows: "", "1", "1.", "1.2", "1.23", "0.5" etc.
                            if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                              handleItemChange(index, "quantity", val);
                            }
                          }}
                          className="w-full px-2 py-1 bg-muted border border-border rounded text-sm text-right"
                          placeholder="1"
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          value={item.unit}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            handleItemChange(index, "unit", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-background border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                        >
                          <option value="szt">szt.</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">l</option>
                          <option value="ml">ml</option>
                          <option value="opak">opak.</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <select
                          value={item.category_id || ""}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const matchedCategory = categories.find(
                              (c) => c.id === selectedId,
                            );

                            // Update the specific item in the array
                            setEditedData((prev) => {
                              const newItems = [...prev.items];
                              newItems[index] = {
                                ...newItems[index],
                                category_id: selectedId,
                                category: matchedCategory
                                  ? matchedCategory.name
                                  : newItems[index].category,
                              };
                              return {
                                ...prev,
                                items: newItems,
                              };
                            });
                          }}
                          className="w-full px-3 py-2 bg-background border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                        >
                          <option value="" disabled>
                            Wybierz...
                          </option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
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
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer"
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
