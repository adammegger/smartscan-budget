import { supabase } from "./supabase";
import { logger } from "./logger";
import { checkAndTriggerAchievements } from "./achievementUtils";
import { processReceiptItems, updateGreenLeaves } from "./eco";
import { refreshAllData } from "./dataRefresh";

export interface ReceiptItem {
  name: string;
  price: number;
  category: string;
  category_id: string | null;
  unit: string;
  quantity: number;
  is_bio: boolean;
}

export interface ReceiptData {
  store_name: string;
  date: string;
  total_amount: number;
  saved_amount: number;
  category: string;
  category_id: string | null;
  items: ReceiptItem[];
}

export const saveReceiptToSupabase = async (receiptData: ReceiptData) => {
  try {
    // Log data before saving to verify UUIDs are present
    logger.log("Dane do zapisu do bazy:", {
      store_name: receiptData.store_name,
      category: receiptData.category,
      category_id: receiptData.category_id,
      items: receiptData.items.map((item) => ({
        name: item.name,
        category: item.category,
        category_id: item.category_id,
        is_bio: item.is_bio,
      })),
    });

    // Get current authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      throw new Error("User not authenticated");
    }

    // Sanitize the receipt data to ensure numeric fields are valid numbers
    const sanitizedItems = receiptData.items.map((item) => ({
      ...item,
      // Convert price to valid number: Number(item.price) || 0
      price: Number(item.price) || 0,
      // Convert quantity to valid number: Number(item.quantity) || 1
      quantity: Number(item.quantity) || 1,
    }));

    // Recalculate total_amount with sanitized prices
    const sanitizedTotalAmount = sanitizedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    // Save receipt to Supabase
    const { data: receiptDataResult, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        store_name: receiptData.store_name,
        date: receiptData.date,
        total_amount: sanitizedTotalAmount,
        saved_amount: receiptData.saved_amount || 0,
        category: receiptData.category,
        category_id: receiptData.category_id,
        user_id: authUser.id,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (receiptError) {
      throw receiptError;
    }

    // Save items with proper category_id and sanitized numeric values
    const itemsToInsert = sanitizedItems.map((item) => ({
      receipt_id: receiptDataResult.id,
      name: item.name,
      price: item.price,
      category: item.category,
      category_id: item.category_id,
      unit: item.unit,
      quantity: item.quantity,
      brand: null,
      user_id: authUser.id,
      is_bio: item.is_bio, // Set the is_bio flag directly on the column
      tags: {}, // Empty tags object
    }));

    const { error: itemsError } = await supabase
      .from("items")
      .insert(itemsToInsert);

    if (itemsError) {
      throw itemsError;
    }

    // Calculate and update green leaves for eco products using sanitized prices
    const { totalGreenLeaves } = processReceiptItems(
      sanitizedItems.map((item) => ({ name: item.name, price: item.price })),
    );
    if (totalGreenLeaves > 0) {
      await updateGreenLeaves(authUser.id, totalGreenLeaves);
    }

    // Check for new achievements using sanitized total
    await checkAndTriggerAchievements(sanitizedTotalAmount, receiptData.date);

    // Refresh cache after successful save
    try {
      await refreshAllData();
    } catch (cacheError) {
      logger.warn("Failed to refresh cache after saving receipt:", cacheError);
    }

    // Dispatch event to notify components that can't use the refresh hook
    window.dispatchEvent(new Event("receiptAdded"));

    return receiptDataResult;
  } catch (error) {
    logger.error("Error saving receipt to Supabase:", error);
    throw error;
  }
};
