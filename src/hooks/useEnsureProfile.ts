import { useState, useEffect } from "react";
import { logger } from "../lib/logger";
import { ensureUserProfile, type Profile } from "../lib/profile";

/**
 * React hook that ensures a user profile exists in the database.
 * Fetches or creates the profile on mount and provides loading/error states.
 *
 * Usage: Use this hook in authenticated layouts/components after login.
 * It will automatically handle profile creation if needed.
 */
export function useEnsureProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);

        const profileData = await ensureUserProfile();

        if (isMounted) {
          setProfile(profileData);
        }
      } catch (err) {
        logger.error("Profile fetch/create error:", err);

        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load profile",
          );
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    // Cleanup function to prevent state updates on unmount
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  return { profile, loading, error };
}
