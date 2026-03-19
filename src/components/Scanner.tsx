import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { scanReceipt } from "../lib/receiptScanApi";
import { supabase } from "../lib/supabase";
import { compressImage } from "../lib/imageCompression";
import {
  determineReceiptCategory,
  autoCategorizeItem,
  getCategoryId,
  CATEGORY_IDS,
} from "../lib/categories";
import { isBioProduct } from "../lib/eco";
import { FREE_TIER_LIMITS, getReceiptsText } from "../lib/config";

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
  onAnalysisComplete: (receiptData: {
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
  }) => void;
  onAnalysisError: (error: string) => void;
}

const Scanner = forwardRef<ScannerRef, ScannerProps>(function Scanner(
  { onImageCaptured, onAnalysisComplete, onAnalysisError },
  ref,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  // Mock scan function for testing achievements
  const triggerMockScan = async () => {
    if (isSimulating) return;

    // 1. Securely fetch the user and their REAL profile directly from DB
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return;

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Failed to fetch profile for scan limits:", profileError);
    }

    console.log("--- REAL-TIME PROFILE CHECK ---");
    console.log("User ID:", user.id);
    console.log("Profile Data:", profileData);

    const currentTier = profileData?.subscription_tier || "free";
    const isPro = currentTier === "pro" || currentTier === "premium";

    console.log("Determined Status - isPro:", isPro, "Tier:", currentTier);

    // 2. ONLY if they are genuinely Free, do we count the receipts
    if (!isPro) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const startOfMonth = `${year}-${month}-01`;

      const { data: receiptsData } = await supabase
        .from("receipts")
        .select("id")
        .eq("user_id", user.id)
        .gte("date", startOfMonth);

      const currentMonthCount = receiptsData ? receiptsData.length : 0;
      console.log("Free User Month Count:", currentMonthCount);

      if (currentMonthCount >= FREE_TIER_LIMITS.MAX_RECEIPTS_PER_MONTH) {
        console.log("BLOCKING! Limit reached.");
        setShowProModal(true);
        return;
      }
    } else {
      console.log("User is PRO! Bypassing receipt limits.");
    }

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

      // Fetch user's categories from Supabase
      const { data: dbCategories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", authUser.id);

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

      // Create category mapping from detailed to main categories
      const categoryMapping: Record<string, string> = {
        Nabiał: "Jedzenie",
        Pieczywo: "Jedzenie",
        Mięso: "Jedzenie",
        Warzywa: "Jedzenie",
        Owoce: "Jedzenie",
        "Produkty suche": "Jedzenie",
        Tłuszcze: "Jedzenie",
        Napoje: "Jedzenie",
        Chemia: "Chemia",
      };

      // Create mock receipt data with proper category_id mapping
      const receiptData = {
        store_name: storeName,
        date: new Date().toISOString().split("T")[0],
        total_amount: totalAmount,
        category: categoryMapping[smartCategory] || smartCategory,
        category_id: getCategoryId(
          categoryMapping[smartCategory] || smartCategory,
        ),
        items: selectedItems.map((item) => {
          // Map detailed category to main category
          const mappedCategoryName =
            categoryMapping[item.category] || item.category;

          // Find matching category from database
          const matchingCategory = categoriesToUse.find(
            (cat: { id: string; name: string }) =>
              cat.name.toLowerCase() === mappedCategoryName.toLowerCase(),
          );

          let category_id = null;
          let category_name = mappedCategoryName;

          if (matchingCategory) {
            category_id = matchingCategory.id;
            category_name = matchingCategory.name;
          } else {
            // Try to find "Inne" category as fallback
            const inneCategory = categoriesToUse.find(
              (cat: { id: string; name: string }) =>
                cat.name.toLowerCase() === "inne",
            );
            if (inneCategory) {
              category_id = inneCategory.id;
              category_name = inneCategory.name;
            }
          }

          return {
            name: item.name,
            price: item.price,
            category: category_name,
            category_id: category_id,
            unit: item.unit,
            quantity: 1,
            is_bio: isBioProduct(item.name),
          };
        }),
      };

      // Don't save to Supabase automatically - pass to verification modal instead

      console.log("🔍 Scanner: Calling onAnalysisComplete with:", receiptData);
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
      // Check if already processing to prevent multiple scans
      if (isProcessing) {
        return;
      }
      setIsProcessing(true);
      // 1. Securely fetch the user and their REAL profile directly from DB
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Failed to fetch profile for scan limits:", profileError);
      }

      console.log("--- REAL-TIME PROFILE CHECK ---");
      console.log("User ID:", user.id);
      console.log("Profile Data:", profileData);

      const currentTier = profileData?.subscription_tier || "free";
      const isPro = currentTier === "pro" || currentTier === "premium";

      console.log("Determined Status - isPro:", isPro, "Tier:", currentTier);

      // 2. ONLY if they are genuinely Free, do we count the receipts
      if (!isPro) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const startOfMonth = `${year}-${month}-01`;

        const { data: receiptsData } = await supabase
          .from("receipts")
          .select("id")
          .eq("user_id", user.id)
          .gte("date", startOfMonth);

        const currentMonthCount = receiptsData ? receiptsData.length : 0;
        console.log("Free User Month Count:", currentMonthCount);

        if (currentMonthCount >= FREE_TIER_LIMITS.MAX_RECEIPTS_PER_MONTH) {
          console.log("BLOCKING! Limit reached.");
          setShowProModal(true);
          return;
        }
      } else {
        console.log("User is PRO! Bypassing receipt limits.");
      }

      console.log("--- FILE UPLOAD TRIGGERED IN SCANNER ---");
      console.log("User Profile:", profileData);
      console.log("Is PRO?", isPro);
      console.log("ALLOWING FILE UPLOAD...");

      // Convert to Base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result;
        if (imageData) {
          onImageCaptured(imageData as string);

          try {
            // Compress image before sending to API
            const compressedImage = await compressImage(imageData as string);

            // Process receipt with Supabase Edge Function (secure server-side Gemini API call)
            const receiptData = await scanReceipt(compressedImage);

            // Determine smart category based on items
            const smartCategory = determineReceiptCategory(
              receiptData.items || [],
              receiptData.total_amount,
            );

            // Build receipt data object for verification
            const receiptDataForVerification = {
              store_name: receiptData.store_name,
              date: receiptData.date,
              total_amount: receiptData.total_amount,
              category: smartCategory,
              category_id: getCategoryId(smartCategory),
              items:
                receiptData.items?.map(
                  (item: {
                    name: string;
                    price: number;
                    category?: string;
                    unit?: string;
                    quantity?: number;
                    brand?: string | null;
                    is_bio?: boolean;
                  }) => {
                    const itemCategory =
                      item.category || autoCategorizeItem(item.name);
                    return {
                      name: item.name,
                      price: item.price,
                      category: itemCategory,
                      category_id: getCategoryId(itemCategory),
                      unit: item.unit || "szt",
                      quantity: item.quantity || 1,
                      is_bio: item.is_bio || false,
                    };
                  },
                ) || [],
            };

            onAnalysisComplete(receiptDataForVerification);
          } catch (error) {
            console.error("Error processing receipt:", error);
            onAnalysisError(
              error instanceof Error
                ? error.message
                : "Nieznany błąd podczas analizy paragonu",
            );
          } finally {
            setIsProcessing(false);
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

      {/* Scanner Limit Upsell Modal - Inline */}
      {showProModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-orange-500/30 rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-6 animate-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-xl font-bold text-foreground">
                Osiągnięto limit skanowania!
              </h3>
            </div>
            <p className="text-foreground/80 mb-6">
              W darmowym planie możesz zeskanować maksymalnie{" "}
              {getReceiptsText(FREE_TIER_LIMITS.MAX_RECEIPTS_PER_MONTH)} w
              miesiącu. Przejdź na plan PRO, aby odblokować nielimitowane
              skanowanie!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowProModal(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-2 rounded-md hover:opacity-90 cursor-pointer"
              >
                Odblokuj PRO
              </button>
              <button
                onClick={() => setShowProModal(false)}
                className="w-full border border-border/50 text-muted-foreground py-2 rounded-md hover:bg-muted cursor-pointer"
              >
                Może później
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default Scanner;
