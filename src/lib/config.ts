/**
 * Single Source of Truth configuration for all application limits and pricing
 * This file contains all the free tier limits and other configuration values
 * that should be easily changeable in one place.
 */

export const FREE_TIER_LIMITS = {
  MAX_RECEIPTS_PER_MONTH: 3,
  MAX_BUDGETS: 2,
  // Add any other free limits here in the future
};

export const PRICING_PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    features: {
      receipts: FREE_TIER_LIMITS.MAX_RECEIPTS_PER_MONTH,
      budgets: FREE_TIER_LIMITS.MAX_BUDGETS,
    },
  },
  PRO: {
    name: "PRO",
    price: 9.99,
    features: {
      receipts: "Nielimitowane",
      budgets: "Nielimitowane",
    },
  },
  PREMIUM: {
    name: "PREMIUM",
    price: 19.99,
    features: {
      receipts: "Nielimitowane",
      budgets: "Nielimitowane",
    },
  },
};

/**
 * Helper function to get the correct Polish form for receipts
 * @param count Number of receipts
 * @returns Correct Polish form
 */
export function getReceiptsText(count: number): string {
  if (count === 1) return "1 paragon";
  if (count >= 2 && count <= 4) return `${count} paragony`;
  return `${count} paragonów`;
}

/**
 * Helper function to get the correct Polish form for budgets
 * @param count Number of budgets
 * @returns Correct Polish form
 */
export function getBudgetsText(count: number): string {
  if (count === 1) return "1 budżet";
  if (count >= 2 && count <= 4) return `${count} budżety`;
  return `${count} budżetów`;
}
