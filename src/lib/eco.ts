import { supabase } from "./supabase";

// BIO keyword patterns to detect eco-friendly products
const BIO_KEYWORDS = [
  "bio",
  "eko",
  "organic",
  "vege",
  "wegetariański",
  "vegetarian",
  "vegan",
  "eko ",
  " bio",
  "ekologiczny",
  "organiczny",
  "naturalny",
];

/**
 * Check if a product name contains BIO/EKO/ORGANIC/VEGE keywords
 */
export function isBioProduct(productName: string): boolean {
  const lowerName = productName.toLowerCase();
  return BIO_KEYWORDS.some((keyword) => lowerName.includes(keyword));
}

/**
 * Calculate green leaves earned from a purchase
 * 5 PLN = 1 green leaf
 */
export function calculateGreenLeaves(amount: number): number {
  return Math.floor(amount / 5);
}

/**
 * Fetch Nutri-Score from Open Food Facts API
 * DISABLED: Open Food Facts integration temporarily disabled for MVP
 */
export async function getNutriScore(
  productName: string,
): Promise<string | null> {
  // Temporarily disabled to make scanning faster and independent of external APIs
  console.log(
    "Open Food Facts Nutri-Score fetching disabled for MVP - returning null",
  );
  return null;

  // Original implementation commented out:
  /*
  try {
    // Clean up product name for search
    const searchTerm = productName
      .replace(/[0-9]/g, "")
      .replace(/[gmlkg]/gi, "")
      .trim()
      .split(" ")
      .slice(0, 3)
      .join(" ");

    if (!searchTerm || searchTerm.length < 3) {
      return null;
    }

    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        searchTerm,
      )}&search_simple=1&action=process&json=1&page_size=5`,
      {
        headers: {
          "User-Agent": "Paragonly - Budget Tracker",
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.products && data.products.length > 0) {
      // Find the best match (lowest Nutri-Score)
      let bestProduct = null;
      let bestScore = 999;

      for (const product of data.products) {
        const nutriScore = product.nutriscore_grade?.toLowerCase();
        if (nutriScore && NUTRI_SCORE_ORDER.includes(nutriScore)) {
          const scoreIndex = NUTRI_SCORE_ORDER.indexOf(nutriScore);
          if (scoreIndex < bestScore) {
            bestScore = scoreIndex;
            bestProduct = product;
          }
        }
      }

      return bestProduct?.nutriscore_grade?.toUpperCase() || null;
    }

    return null;
  } catch (error) {
    console.error("Error fetching Nutri-Score:", error);
    return null;
  }
  */
}

/**
 * Check if Nutri-Score is a warning (D or E)
 */
export function isNutriScoreWarning(score: string | null): boolean {
  if (!score) return false;
  return score.toLowerCase() === "d" || score.toLowerCase() === "e";
}

/**
 * Update user's green leaves count in profiles table
 */
export async function updateGreenLeaves(
  userId: string,
  leavesToAdd: number,
): Promise<number> {
  try {
    // First, try to get current count
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("green_leaves_count")
      .eq("id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching profile:", fetchError);
      return 0;
    }

    const currentCount = profile?.green_leaves_count || 0;
    const newCount = currentCount + leavesToAdd;

    // Update the count
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ green_leaves_count: newCount })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating green leaves:", updateError);
      return 0;
    }

    return newCount;
  } catch (error) {
    console.error("Error in updateGreenLeaves:", error);
    return 0;
  }
}

/**
 * Get user's green leaves count
 */
export async function getGreenLeavesCount(userId: string): Promise<number> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("green_leaves_count")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching green leaves:", error);
      return 0;
    }

    return profile?.green_leaves_count || 0;
  } catch (error) {
    console.error("Error in getGreenLeavesCount:", error);
    return 0;
  }
}

/**
 * Get products from a receipt and check which are BIO
 */
export function processReceiptItems(
  items: Array<{ name: string; price: number }>,
): {
  bioItems: Array<{ name: string; price: number }>;
  totalGreenLeaves: number;
} {
  const bioItems: Array<{ name: string; price: number }> = [];
  let totalGreenLeaves = 0;

  for (const item of items) {
    if (isBioProduct(item.name)) {
      bioItems.push(item);
      totalGreenLeaves += calculateGreenLeaves(item.price);
    }
  }

  return { bioItems, totalGreenLeaves };
}
