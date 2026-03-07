import { supabase } from "./supabase";

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  user_id: string | null;
}

// Cache state
let cachedCategories: Category[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Get categories with caching
export async function getCategories(): Promise<Category[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedCategories && now - cacheTimestamp < CACHE_DURATION) {
    return cachedCategories;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    cachedCategories = data || [];
    cacheTimestamp = now;

    return cachedCategories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return cachedCategories || [];
  }
}

// Clear cache (useful for mutations)
export function clearCategoryCache() {
  cachedCategories = null;
  cacheTimestamp = 0;
}

// Preload categories (call this when user logs in or app starts)
export async function preloadCategories() {
  try {
    await getCategories();
  } catch (error) {
    console.error("Error preloading categories:", error);
  }
}

// Get category by name (synchronous, uses cached data)
export function getCategoryByName(categoryName: string): Category | undefined {
  if (!cachedCategories) {
    return undefined;
  }

  return cachedCategories.find(
    (cat) => cat.name.toLowerCase() === categoryName.toLowerCase(),
  );
}

// Get category color by name (synchronous, uses cached data)
export function getCategoryColor(categoryName: string): string {
  const category = getCategoryByName(categoryName);
  return category?.color || "#6b7280"; // Default gray if not found
}

// Get category icon by name (synchronous, uses cached data)
export function getCategoryIcon(categoryName: string): string {
  const category = getCategoryByName(categoryName);
  return category?.icon || "MoreHorizontal";
}
