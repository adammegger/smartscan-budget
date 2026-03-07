import { supabase } from "./supabase";

// Define the Profile type based on the public.profiles table structure
export interface Profile {
  id: string; // uuid, FK to auth.users(id)
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  green_leaves_count: number;
  subscription_tier: "free" | "pro" | "premium";
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
  role: string;
  locale: string;
  onboarded: boolean;
}

/**
 * Ensures that a user profile exists in the public.profiles table.
 * If the profile doesn't exist, it creates one with minimal data.
 *
 * @param supabaseClient - The Supabase client instance
 * @returns Promise<Profile | null> - The profile data or null if no authenticated user
 * @throws Error if database operations fail
 */
export async function ensureUserProfile(): Promise<Profile | null> {
  // Get the current authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If no authenticated user, return null (don't throw - this is expected for unauthenticated state)
  if (authError || !user) {
    return null;
  }

  // Try to get existing profile
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to fetch profile: ${selectError.message}`);
  }

  // If profile exists, return it
  if (existingProfile) {
    return existingProfile;
  }

  // Profile doesn't exist, create a new one
  const { data: newProfile, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      first_name: null,
      last_name: null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      // Other fields will use database defaults:
      // green_leaves_count: 0 (default)
      // created_at: now() (default)
      // updated_at: now() (default)
      // role: 'user' (default)
      // locale: 'pl-PL' (default)
      // onboarded: false (default)
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create profile: ${insertError.message}`);
  }

  return newProfile;
}
