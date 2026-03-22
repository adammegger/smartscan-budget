import { supabase } from "./supabase";
import { logger } from "./logger";

/**
 * Delete the current user and all their data
 * This function calls the Supabase SQL function delete_user()
 */
export async function deleteUserAccount(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Call the SQL function delete_user()
    const { error } = await supabase.rpc("delete_user");

    if (error) {
      logger.error("Error deleting user:", error);
      return {
        success: false,
        error: error.message || "Wystąpił błąd podczas usuwania konta",
      };
    }

    return { success: true };
  } catch (error) {
    logger.error("Delete user error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Nieznany błąd podczas usuwania konta",
    };
  }
}

/**
 * Get user data summary before deletion for confirmation
 */
export async function getUserDataSummary(): Promise<{
  receipts_count: number;
  budgets_count: number;
  profile_exists: boolean;
  error?: string;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        receipts_count: 0,
        budgets_count: 0,
        profile_exists: false,
        error: "Użytkownik nie jest zalogowany",
      };
    }

    const { data, error } = await supabase.rpc("get_user_data_summary", {
      user_id: user.id,
    });

    if (error) {
      logger.error("Error getting user data summary:", error);
      return {
        receipts_count: 0,
        budgets_count: 0,
        profile_exists: false,
        error: error.message || "Wystąpił błąd podczas pobierania danych",
      };
    }

    return {
      receipts_count: data?.receipts_count || 0,
      budgets_count: data?.budgets_count || 0,
      profile_exists: data?.profile_exists || false,
    };
  } catch (error) {
    logger.error("Get user data summary error:", error);
    return {
      receipts_count: 0,
      budgets_count: 0,
      profile_exists: false,
      error:
        error instanceof Error
          ? error.message
          : "Nieznany błąd podczas pobierania danych",
    };
  }
}
