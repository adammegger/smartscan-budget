import { supabase } from "./supabase";

/**
 * Scan a receipt using the Supabase Edge Function instead of calling Gemini directly.
 * This keeps the Google API key secure on the server side.
 *
 * @param imageBase64 - The base64 encoded image data URL (e.g., "data:image/jpeg;base64,....")
 * @returns Promise that resolves to the parsed receipt data or throws an error
 */
export async function scanReceiptViaFunction(imageBase64: string) {
  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("scan-receipt", {
      body: { imageBase64 },
    });

    if (error) {
      throw new Error(`Supabase function error: ${error.message}`);
    }

    // The function returns { success: boolean, data?: ParsedReceipt, error?: string }
    if (!data) {
      throw new Error("No response from scan-receipt function");
    }

    if (!data.success) {
      throw new Error(data.error || "Failed to scan receipt");
    }

    // Return the parsed receipt data
    return data.data;
  } catch (error) {
    console.error("Error scanning receipt via function:", error);
    throw error;
  }
}

/**
 * Type definitions for the parsed receipt data structure
 */
export interface ReceiptItem {
  name: string;
  price: number;
  category: string;
  unit: string;
  quantity: number;
  brand: string | null;
}

export interface ParsedReceipt {
  store_name: string;
  date: string;
  total_amount: number;
  category: string;
  items: ReceiptItem[];
}

// Note: The original processReceipt function in gemini.ts should be kept for local development
// but should NOT be used in production. It should be clearly marked as development-only.
