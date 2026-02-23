import { checkAchievements } from "./achievements";
import { supabase } from "./supabase";

/**
 * Check for new achievements after a receipt is scanned
 * and trigger confetti effect if new achievements are earned
 * @returns Array of newly earned achievement IDs
 */
export async function checkAndTriggerAchievements(): Promise<string[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return await checkAchievements(user.id);
    }
  } catch (error) {
    console.error("Error in checkAndTriggerAchievements:", error);
  }
  return [];
}
