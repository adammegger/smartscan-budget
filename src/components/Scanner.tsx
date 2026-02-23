import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { processReceipt } from "../lib/gemini";
import { supabase } from "../lib/supabase";
import {
  determineReceiptCategory,
  autoCategorizeItem,
  getCategoryId,
} from "../lib/categories";
import { checkAndTriggerAchievements } from "../lib/achievementUtils";
import {
  isBioProduct,
  calculateGreenLeaves,
  updateGreenLeaves,
  processReceiptItems,
} from "../lib/eco";

// Mock data for testing
const MOCK_STORES = [
  "Biedronka",
  "Lidl",
  "Auchan",
  "Batory",
  "Carrefour",
  "Aldi",
  "Tesco",
  "Żabka",
];

const MOCK_ITEMS = [
  { name: "Mleko 3.5%", category: "Nabiał", price: 3.49, unit: "l" },
  { name: "Chleb pszenny", category: "Pieczywo", price: 4.29, unit: "szt" },
  { name: "Masło extra", category: "Nabiał", price: 7.99, unit: "250g" },
  { name: "Jajka XL", category: "Nabiał", price: 8.99, unit: "10szt" },
  { name: "Kurczak", category: "Mięso", price: 12.99, unit: "kg" },
  { name: "Ziemniaki", category: "Warzywa", price: 2.99, unit: "kg" },
  { name: "Cebula", category: "Warzywa", price: 1.99, unit: "kg" },
  { name: "Pomidor", category: "Warzywa", price: 5.99, unit: "kg" },
  {
    name: "Makaron spaghetti",
    category: "Produkty suche",
    price: 3.49,
    unit: "500g",
  },
  { name: "Ryż długi", category: "Produkty suche", price: 4.49, unit: "1kg" },
  { name: "Olej rzepakowy", category: "Tłuszcze", price: 6.99, unit: "1l" },
  { name: "Coca-Cola", category: "Napoje", price: 5.49, unit: "2l" },
  { name: "Kawa mielona", category: "Napoje", price: 14.99, unit: "250g" },
  { name: "Szampon", category: "Chemia", price: 11.99, unit: "400ml" },
  { name: "Płyn do naczyń", category: "Chemia", price: 4.99, unit: "500ml" },
  { name: "Papier toaletowy", category: "Chemia", price: 8.99, unit: "4rol" },
  { name: "Ser żółty", category: "Nabiał", price: 15.99, unit: "300g" },
  { name: "Jogurt naturalny", category: "Nabiał", price: 2.49, unit: "400g" },
  { name: "Szynka", category: "Mięso", price: 9.99, unit: "200g" },
  { name: "Bułki", category: "Pieczywo", price: 2.99, unit: "6szt" },
  // BIO products for testing eco features
  { name: "Mleko BIO", category: "Nabiał", price: 5.99, unit: "l" },
  { name: "Jajka EKO", category: "Nabiał", price: 9.99, unit: "6szt" },
  { name: "Warzywa BIO", category: "Warzywa", price: 7.49, unit: "kg" },
  { name: "Owoce ORGANIC", category: "Owoce", price: 8.99, unit: "kg" },
  { name: "Chleb VEGE", category: "Pieczywo", price: 6.49, unit: "szt" },
];

export interface ScannerRef {
  triggerCamera: () => void;
  triggerMockScan: () => Promise<void>;
}

interface ScannerProps {
  onImageCaptured: (imageData: string | Blob) => void;
  onAnalysisComplete: (receiptData: any) => void;
  onAnalysisError: (error: string) => void;
}

const Scanner = forwardRef<ScannerRef, ScannerProps>(function Scanner(
  { onImageCaptured, onAnalysisComplete, onAnalysisError },
  ref,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Mock scan function for testing achievements
  const triggerMockScan = async () => {
    if (isSimulating) return;

    setIsSimulating(true);
    onImageCaptured("mock-image-data");

    try {
      // Get current authenticated user
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        throw new Error("User not authenticated");
      }

      // Simulate "analyzing" delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate random store
      const storeName =
        MOCK_STORES[Math.floor(Math.random() * MOCK_STORES.length)];

      // Generate 3-5 random items
      const numItems = Math.floor(Math.random() * 3) + 3;
      const shuffledItems = [...MOCK_ITEMS].sort(() => 0.5 - Math.random());
      const selectedItems = shuffledItems.slice(0, numItems);

      // Calculate total
      const totalAmount = selectedItems.reduce(
        (sum, item) => sum + item.price,
        0,
      );

      // Determine category
      const smartCategory = determineReceiptCategory(
        selectedItems,
        totalAmount,
      );

      // Create mock receipt data
      const receiptData = {
        store_name: storeName,
        date: new Date().toISOString().split("T")[0],
        total_amount: totalAmount,
        items: selectedItems.map((item) => ({
          name: item.name,
          price: item.price,
          category: item.category,
          unit: item.unit,
          quantity: 1,
        })),
      };

      // Save receipt to Supabase
      const { data: receiptDataResult, error: receiptError } = await supabase
        .from("receipts")
        .insert({
          store_name: receiptData.store_name,
          date: receiptData.date,
          total_amount: receiptData.total_amount,
          category: smartCategory,
          user_id: authUser.id,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (receiptError) {
        throw receiptError;
      }

      // Save items
      const itemsToInsert = selectedItems.map((item) => ({
        receipt_id: receiptDataResult.id,
        name: item.name,
        price: item.price,
        category: item.category,
        unit: item.unit,
        quantity: 1,
        brand: null,
        user_id: authUser.id,
        tags: {}, // Initialize empty tags object for JSONB column
      }));

      const { error: itemsError } = await supabase
        .from("items")
        .insert(itemsToInsert);

      if (itemsError) {
        throw itemsError;
      }

      // Calculate and update green leaves for eco products
      const { totalGreenLeaves } = processReceiptItems(
        selectedItems.map((item) => ({ name: item.name, price: item.price })),
      );
      if (totalGreenLeaves > 0) {
        await updateGreenLeaves(authUser.id, totalGreenLeaves);
      }

      // Check for new achievements
      await checkAndTriggerAchievements();

      onAnalysisComplete(receiptData);
    } catch (error) {
      console.error("Error in mock scan:", error);
      onAnalysisError(
        error instanceof Error
          ? error.message
          : "Błąd podczas symulacji skanowania",
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Convert to Base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result;
        if (imageData) {
          onImageCaptured(imageData as string);

          try {
            // Get current authenticated user
            const {
              data: { user: authUser },
              error: authError,
            } = await supabase.auth.getUser();

            if (authError || !authUser) {
              throw new Error("User not authenticated");
            }

            // Process receipt with Gemini AI
            const receiptData = await processReceipt(imageData as string);

            // Determine smart category based on items
            const smartCategory = determineReceiptCategory(
              receiptData.items || [],
              receiptData.total_amount,
            );

            // Save to Supabase - save receipt with user_id
            const { data: receiptDataResult, error: receiptError } =
              await supabase
                .from("receipts")
                .insert({
                  store_name: receiptData.store_name,
                  date: receiptData.date,
                  total_amount: receiptData.total_amount,
                  category: smartCategory,
                  user_id: authUser.id,
                  created_at: new Date().toISOString(),
                })
                .select("id")
                .single();

            if (receiptError) {
              throw receiptError;
            }

            // Save items to separate table with all new fields
            if (receiptData.items && Array.isArray(receiptData.items)) {
              const itemsToInsert = receiptData.items.map(
                (item: {
                  name: string;
                  price: number;
                  category?: string;
                  unit?: string;
                  quantity?: number;
                  brand?: string | null;
                }) => {
                  const itemCategory =
                    item.category || autoCategorizeItem(item.name);
                  return {
                    receipt_id: receiptDataResult.id,
                    name: item.name,
                    price: item.price,
                    // Use provided category or auto-categorize based on name
                    category: itemCategory,
                    // Also set category_id for foreign key
                    category_id: getCategoryId(itemCategory),
                    unit: item.unit || "szt",
                    quantity: item.quantity || 1,
                    brand: item.brand || null,
                    user_id: authUser.id,
                    tags: {}, // Initialize empty tags object for JSONB column
                  };
                },
              );

              const { error: itemsError } = await supabase
                .from("items")
                .insert(itemsToInsert);

              if (itemsError) {
                throw itemsError;
              }
            }

            // Check for new achievements after saving receipt
            await checkAndTriggerAchievements();

            onAnalysisComplete(receiptData);
          } catch (error) {
            console.error("Error processing receipt:", error);
            onAnalysisError(
              error instanceof Error
                ? error.message
                : "Nieznany błąd podczas analizy paragonu",
            );
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  // Expose both functions to parent components
  useImperativeHandle(ref, () => ({
    triggerCamera,
    triggerMockScan,
  }));

  return (
    <>
      {/* Invisible file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
});

export default Scanner;
