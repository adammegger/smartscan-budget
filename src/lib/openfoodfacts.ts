// OpenFoodFacts API Service
// https://world.openfoodfacts.org/cgi/search.pl

export interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  nutrition_grades?: string;
  nutriments?: {
    proteins_100g?: number;
    proteins?: number;
    fat_100g?: number;
    fat?: number;
    carbohydrates_100g?: number;
    carbohydrates?: number;
    salt_100g?: number;
    salt?: number;
    sugars_100g?: number;
    sugars?: number;
    "saturated-fat_100g"?: number;
    "saturated-fat"?: number;
    fiber_100g?: number;
    fiber?: number;
    "energy-kcal_100g"?: number;
    "nova-group"?: number;
  };
  additives_tags?: string[];
  labels_tags?: string[];
  ingredients_text?: string;
  allergens_tags?: string[];
  [key: string]: any;
}

export interface OpenFoodFactsResponse {
  count: number;
  page: number;
  page_size: number;
  products: OpenFoodFactsProduct[];
}

// Nutri-Score colors
export const NUTRI_SCORE_COLORS: Record<string, string> = {
  a: "bg-green-500",
  b: "bg-green-400",
  c: "bg-yellow-400",
  d: "bg-orange-500",
  e: "bg-red-600",
};

export const NUTRI_SCORE_TEXT_COLORS: Record<string, string> = {
  a: "text-green-500",
  b: "text-green-400",
  c: "text-yellow-500",
  d: "text-orange-500",
  e: "text-red-600",
};

// Search for a product by name using Supabase Edge Function (to avoid CORS)
// DISABLED: Open Food Facts integration temporarily disabled for MVP
export async function searchProduct(
  searchTerm: string,
  supabaseClient?: unknown,
): Promise<OpenFoodFactsProduct | null> {
  // Temporarily disabled to make scanning faster and independent of external APIs
  console.log("Open Food Facts search disabled for MVP - returning null");
  return null;

  // Original implementation commented out:
  /*
  try {
    // If we have a Supabase client, use the Edge Function
    if (supabaseClient) {
      const { data, error } = await supabaseClient.functions.invoke(
        "get-product-data",
        {
          body: { productName: searchTerm },
        },
      );

      if (error) {
        console.error("Edge Function error:", error);
        return null;
      }

      // Edge Function returns full response with products array
      // Extract first product from the array
      if (data && data.products && data.products.length > 0) {
        return data.products[0] as OpenFoodFactsProduct;
      }

      return null;
    }

    // Fallback to direct API call (for backward compatibility)
    const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
    url.searchParams.set("search_terms", searchTerm);
    url.searchParams.set("search_simple", "1");
    url.searchParams.set("action", "process");
    url.searchParams.set("json", "1");
    url.searchParams.set("page_size", "1");
    url.searchParams.set(
      "fields",
      "product_name,brands,nutrition_grades,nutriments,additives_tags,labels_tags,ingredients_text,allergens_tags",
    );

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error("OpenFoodFacts API error:", response.status);
      return null;
    }

    const data: OpenFoodFactsResponse = await response.json();

    if (data.products && data.products.length > 0) {
      return data.products[0];
    }

    return null;
  } catch (error) {
    console.error("Error fetching product from OpenFoodFacts:", error);
    return null;
  }
  */
}

// Check if product is BIO (organic)
export function isBioProduct(product: OpenFoodFactsProduct): boolean {
  const labels = product.labels_tags || [];
  return labels.some(
    (label) =>
      label.toLowerCase().includes("bio") ||
      label.toLowerCase().includes("organic") ||
      label.toLowerCase().includes("eko") ||
      label.toLowerCase().includes("ab-agriculture"),
  );
}

// Check if product has high salt
export function isHighSalt(product: OpenFoodFactsProduct): boolean {
  const salt = product.nutriments?.salt_100g || 0;
  return salt > 1.5;
}

// Check if product has high sugar
export function isHighSugar(product: OpenFoodFactsProduct): boolean {
  const sugars = product.nutriments?.["sugars_100g"] || 0;
  return sugars > 10;
}

// Check if product has high saturated fat
export function isHighFat(product: OpenFoodFactsProduct): boolean {
  const satFat = product.nutriments?.["saturated-fat_100g"] || 0;
  return satFat > 5;
}

// Check if product is not recommended (D or E grade)
export function isNotRecommended(product: OpenFoodFactsProduct): boolean {
  const grade = product.nutrition_grades?.toLowerCase();
  return grade === "d" || grade === "e";
}

// Get macronutrients
export function getMacronutrients(product: OpenFoodFactsProduct): {
  protein: number;
  fat: number;
  carbs: number;
} {
  return {
    protein: product.nutriments?.proteins_100g || 0,
    fat: product.nutriments?.fat_100g || 0,
    carbs: product.nutriments?.carbohydrates_100g || 0,
  };
}

// Interface for the full JSONB tags object
export interface ProductTags {
  nutriscore?: string;
  isBio?: boolean;
  isHighSalt?: boolean;
  isHighSugar?: boolean;
  isHighFat?: boolean;
  protein?: number;
  fat?: number;
  carbs?: number;
  fiber?: number;
  salt?: number;
  sugars?: number;
  additives?: string[];
  allergens?: string[];
  ingredients?: string;
  brand?: string;
  cachedAt?: string;
}

// Fetch and cache product tags
// DISABLED: Open Food Facts integration temporarily disabled for MVP
export async function fetchAndCacheProductTags(
  productName: string,
  supabase: unknown,
  userId: string,
): Promise<ProductTags | null> {
  // Temporarily disabled to make scanning faster and independent of external APIs
  console.log("Open Food Facts tag fetching disabled for MVP - returning null");
  return null;

  // Original implementation commented out:
  /*
  // First check if we have cached tags in the database
  const { data: existingItem } = await supabase
    .from("items")
    .select("tags")
    .eq("name", productName)
    .eq("user_id", userId)
    .limit(1)
    .single();

  // Check if cache is less than 30 days old
  if (existingItem?.tags?.cachedAt) {
    const cacheAge =
      Date.now() - new Date(existingItem.tags.cachedAt).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    if (cacheAge < thirtyDays) {
      console.log("Using cached tags for:", productName);
      return existingItem.tags as ProductTags;
    }
  }

  // Fetch fresh data from API using Supabase Edge Function (to avoid CORS)
  console.log("Fetching fresh data from OpenFoodFacts for:", productName);
  const product = await searchProduct(productName, supabase);

  if (!product) {
    return null;
  }

  // Create full tags object for JSONB column
  const tags: ProductTags = {
    nutriscore: product.nutrition_grades?.toUpperCase() || undefined,
    isBio: isBioProduct(product.name),
    isHighSalt: isHighSalt(product),
    isHighSugar: isHighSugar(product),
    isHighFat: isHighFat(product),
    protein: product.nutriments?.proteins_100g,
    fat: product.nutriments?.fat_100g,
    carbs: product.nutriments?.carbohydrates_100g,
    fiber: product.nutriments?.fiber_100g,
    salt: product.nutriments?.salt_100g,
    sugars: product.nutriments?.["sugars_100g"],
    additives: product.additives_tags,
    allergens: product.allergens_tags,
    ingredients: product.ingredients_text,
    brand: product.brands,
    cachedAt: new Date().toISOString(),
  };

  // Save to database (update all items with this product name)
  await supabase
    .from("items")
    .update({ tags })
    .eq("name", productName)
    .eq("user_id", userId);

  return tags;
  */
}
