/**
 * Scan a receipt using a plain fetch request to the Supabase Edge Function.
 * This avoids auth issues by not using the Supabase client.
 *
 * @param imageBase64 - The base64 encoded image data URL (e.g., "data:image/jpeg;base64,....")
 * @returns Promise that resolves to the parsed receipt data or throws an error
 */
export async function scanReceipt(imageBase64: string) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-receipt`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageBase64 }),
  });

  const json = await res.json();
  console.log("scan-receipt result", res.status, json);

  if (!res.ok || !json.success) {
    throw new Error(json.error || "Failed to scan receipt");
  }

  return json.data;
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
