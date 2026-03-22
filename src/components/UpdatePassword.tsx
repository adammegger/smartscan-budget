import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "../lib/theme";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Loader2,
  XCircle,
  CheckCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
} from "lucide-react";

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (hasRecoverySession === null) {
        setHasRecoverySession(false);
      }
    }, 10000);

    // Sprawdź sesję na mount – jeśli użytkownik już ma sesję recovery
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setHasRecoverySession(true);
        clearTimeout(timeout);
      }
    };
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, session);
      if (event === "PASSWORD_RECOVERY") {
        setHasRecoverySession(true);
        clearTimeout(timeout);
      } else if (event === "SIGNED_IN" && session) {
        // Supabase czasem emituje SIGNED_IN zamiast PASSWORD_RECOVERY
        setHasRecoverySession(true);
        clearTimeout(timeout);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
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

  const handleGoToLogin = () => {
    navigate("/login");
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            {/* Logo/nagłówek aplikacji */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-orange-500 tracking-widest">
                PARAGONLY
              </h1>
            </div>

            {/* Loading State */}
            {hasRecoverySession === null && (
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
              </div>
            )}

            {/* No Permissions State */}
            {hasRecoverySession === false && (
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
            )}

            {/* Success State */}
            {success && (
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            )}

            <CardTitle className="text-xl font-semibold text-foreground">
              {hasRecoverySession === null && "Sprawdzanie uprawnień..."}
              {hasRecoverySession === false && "Brak uprawnień"}
              {hasRecoverySession === true && !success && "Ustaw nowe hasło"}
              {success && "Hasło zostało zmienione!"}
              {error && !success && "Błąd zapisu"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Loading State Content */}
            {hasRecoverySession === null && (
              <p className="text-center text-muted-foreground">
                Trwa weryfikacja sesji...
              </p>
            )}

            {/* No Permissions State Content */}
            {hasRecoverySession === false && (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Nie masz uprawnień do zmiany hasła.
                </p>
                <Button
                  onClick={handleGoToLogin}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Wróć do logowania
                </Button>
              </div>
            )}

            {/* Form State */}
            {hasRecoverySession === true && !success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-muted-foreground mb-2"
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
                      placeholder="Wprowadź nowe hasło"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
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
                            const metConditions =
                              conditions.filter(Boolean).length;
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
                            const metConditions =
                              conditions.filter(Boolean).length;
                            if (metConditions === 0) return "w-0";
                            if (metConditions === 1) return "w-1/3 bg-red-500";
                            if (metConditions === 2)
                              return "w-2/3 bg-yellow-500";
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
                    className="block text-sm font-medium text-muted-foreground mb-2"
                  >
                    Potwierdź hasło
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input pr-10"
                      placeholder="Potwierdź nowe hasło"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/50 rounded-md p-3">
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !/(?=.*[A-Z])/.test(newPassword) ||
                    !/(?=.*[0-9])/.test(newPassword) ||
                    newPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ustawianie hasła...
                    </span>
                  ) : (
                    "Ustaw nowe hasło"
                  )}
                </Button>
              </form>
            )}

            {/* Success State Content */}
            {success && (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Twoje hasło zostało pomyślnie zmienione.
                </p>
                <Button
                  onClick={handleGoToLogin}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Przejdź do logowania
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
}
