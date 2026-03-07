import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import AuthLayout from "./AuthLayout";
import { Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // Password validation - only check mismatch since visual checklist handles strength
    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      setLoading(false);
      return;
    }

    // Check if all password requirements are met
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /(?=.*[A-Z])/.test(newPassword);
    const hasNumber = /(?=.*[0-9])/.test(newPassword);

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError("Proszę spełnić wszystkie wymagania dotyczące hasła.");
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
      // Redirect to dashboard after success using client-side routing
      setTimeout(() => {
        navigate("/dashboard");
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
    <AuthLayout title="Ustaw nowe hasło" showLogo={true}>
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
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input pr-12"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer p-1 pointer-events-auto"
                  aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  {newPassword.length >= 8 ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <Circle size={14} className="text-muted-foreground" />
                  )}
                  <span
                    className={
                      newPassword.length >= 8
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    }
                  >
                    Minimum 8 znaków
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {/(?=.*[A-Z])/.test(newPassword) ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <Circle size={14} className="text-muted-foreground" />
                  )}
                  <span
                    className={
                      /(?=.*[A-Z])/.test(newPassword)
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    }
                  >
                    Przynajmniej 1 duża litera
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {/(?=.*[0-9])/.test(newPassword) ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <Circle size={14} className="text-muted-foreground" />
                  )}
                  <span
                    className={
                      /(?=.*[0-9])/.test(newPassword)
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground"
                    }
                  >
                    Przynajmniej 1 cyfra
                  </span>
                </div>
              </div>
            )}

            {/* Password Strength Progress Bar */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Siła hasła</span>
                  <span>
                    {(() => {
                      const conditions = [
                        newPassword.length >= 8,
                        /(?=.*[A-Z])/.test(newPassword),
                        /(?=.*[0-9])/.test(newPassword),
                      ];
                      const metConditions = conditions.filter(Boolean).length;
                      return `${metConditions}/3`;
                    })()}
                  </span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${(() => {
                      const conditions = [
                        newPassword.length >= 8,
                        /(?=.*[A-Z])/.test(newPassword),
                        /(?=.*[0-9])/.test(newPassword),
                      ];
                      const metConditions = conditions.filter(Boolean).length;
                      if (metConditions === 0) return "w-0";
                      if (metConditions === 1) return "w-1/3 bg-red-500";
                      if (metConditions === 2) return "w-2/3 bg-yellow-500";
                      return "w-full bg-green-500";
                    })()}`}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Potwierdź nowe hasło
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input pr-12"
                placeholder="••••••••"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer p-1 pointer-events-auto"
                  aria-label={
                    showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-[20px]">
            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-md p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-primary-foreground font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative z-50"
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

      <div className="absolute bottom-8 left-0 right-0 text-center">
        <div className="text-center space-y-2">
          <div>
            <span
              onClick={() => navigate("/dashboard")}
              className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer relative z-10"
            >
              Przejdź do dashboardu
            </span>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
