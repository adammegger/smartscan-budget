import { checkAchievements } from "./achievements";
import { supabase } from "./supabase";

/**
 * Check for new achievements after a receipt is scanned
 * and trigger confetti effect if new achievements are earned
 * @param totalAmount Amount of the new receipt
 * @param date Date of the new receipt
 * @returns Array of newly earned achievement IDs
 */
export async function checkAndTriggerAchievements(
  totalAmount?: number,
  date?: string,
): Promise<string[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return await checkAchievements(user.id, {
        total_amount: totalAmount || 0,
        date: date || "",
      });
    }
  } catch (error) {
    console.error("Error in checkAndTriggerAchievements:", error);
  }
  return [];
}
