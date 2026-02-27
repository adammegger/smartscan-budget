import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import AuthLayout from "./AuthLayout";

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recoverySession, setRecoverySession] = useState<unknown>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event, session);

      if (event === "PASSWORD_RECOVERY" && session) {
        // User returned from password reset link, temporarily authenticated
        setRecoverySession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne");
      setLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      // Redirect to dashboard after success
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err) {
      console.error("Update password error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Błąd podczas zmiany hasła. Spróbuj ponownie.",
      );
    } finally {
      setLoading(false);
    }
  };

  // If no recovery session, user shouldn't be here
  if (!recoverySession) {
    return (
      <AuthLayout title="Błąd">
        <div className="text-center py-4">
          <h2 className="text-2xl font-bold text-destructive mb-4">Błąd</h2>
          <p className="text-muted-foreground">
            Nie masz uprawnień do zmiany hasła. Wróć do strony logowania.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Ustaw nowe hasło">
      {success ? (
        <div className="text-center py-4">
          <div className="bg-green-500/10 border border-green-500/50 rounded-md p-4 mb-4">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Hasło zostało zmienione! Możesz się teraz zalogować.
            </p>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">
            Przekierowanie do dashboardu...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Nowe hasło
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Potwierdź nowe hasło
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-md p-3">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-primary-foreground font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                Ustawianie hasła...
              </span>
            ) : (
              "Ustaw nowe hasło"
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
