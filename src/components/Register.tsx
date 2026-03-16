import { useState } from "react";
import { supabase } from "../lib/supabase";
import AuthLayout from "./AuthLayout";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";

interface RegisterProps {
  onRegisterSuccess: () => void;
}

export default function Register({ onRegisterSuccess }: RegisterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Terms validation
    if (!acceptedTerms) {
      setError("Musisz zaakceptować regulamin, aby kontynuować.");
      setLoading(false);
      return;
    }

    // Password validation - only check mismatch since visual checklist handles strength
    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      setLoading(false);
      return;
    }

    // Check if all password requirements are met
    const hasMinLength = password.length >= 8;
    const hasUppercase = /(?=.*[A-Z])/.test(password);
    const hasNumber = /(?=.*[0-9])/.test(password);

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError("Proszę spełnić wszystkie wymagania dotyczące hasła.");
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Registration error:", err);
      let errorMessage = "Błąd rejestracji. Spróbuj ponownie.";

      if (err && typeof err === "object" && "message" in err) {
        const msg = (err as { message: string }).message.toLowerCase();
        if (msg.includes("user already registered")) {
          errorMessage = "Konto z tym adresem e-mail już istnieje.";
        } else if (msg.includes("password should be at least")) {
          errorMessage = "Hasło jest zbyt krótkie (minimum 6 znaków).";
        } else if (msg.includes("invalid email")) {
          errorMessage = "Podano nieprawidłowy adres e-mail.";
        } else if (msg.includes("rate limit")) {
          errorMessage = "Zbyt wiele prób. Spróbuj ponownie za chwilę.";
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Załóż nowe konto" showLogo={true}>
      <div className="max-w-md mx-auto w-full">
        {success ? (
          <div className="text-center py-4">
            <div className="bg-green-500/10 border border-green-500/50 rounded-md p-4 mb-4">
              <p className="text-green-600 dark:text-green-400 font-medium">
                Konto zostało założone! Sprawdź swoją skrzynkę e-mail i kliknij
                link aktywacyjny, aby dokończyć rejestrację.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof onRegisterSuccess === "function") {
                  onRegisterSuccess();
                }
                navigate("/login");
              }}
              className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-4 rounded-md transition-all duration-200 cursor-pointer shadow-lg outline-none border-none relative z-50 pointer-events-auto"
            >
              Wróć do logowania
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Adres e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input relative z-0"
                placeholder="twoj@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Hasło
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    {password.length >= 8 ? (
                      <CheckCircle2 size={14} className="text-green-500" />
                    ) : (
                      <Circle size={14} className="text-muted-foreground" />
                    )}
                    <span
                      className={
                        password.length >= 8
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      Minimum 8 znaków
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {/(?=.*[A-Z])/.test(password) ? (
                      <CheckCircle2 size={14} className="text-green-500" />
                    ) : (
                      <Circle size={14} className="text-muted-foreground" />
                    )}
                    <span
                      className={
                        /(?=.*[A-Z])/.test(password)
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }
                    >
                      Przynajmniej 1 duża litera
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {/(?=.*[0-9])/.test(password) ? (
                      <CheckCircle2 size={14} className="text-green-500" />
                    ) : (
                      <Circle size={14} className="text-muted-foreground" />
                    )}
                    <span
                      className={
                        /(?=.*[0-9])/.test(password)
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
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Siła hasła</span>
                    <span>
                      {(() => {
                        const conditions = [
                          password.length >= 8,
                          /(?=.*[A-Z])/.test(password),
                          /(?=.*[0-9])/.test(password),
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
                          password.length >= 8,
                          /(?=.*[A-Z])/.test(password),
                          /(?=.*[0-9])/.test(password),
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
                Powtórz hasło
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

            {/* Terms and Privacy Policy Checkbox */}
            <div className="flex items-start space-x-3">
              <div className="flex items-center h-5">
                <input
                  id="acceptedTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-orange-500 bg-muted border-border rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                />
              </div>
              <div className="text-sm text-gray-400">
                <label htmlFor="acceptedTerms" className="cursor-pointer">
                  Akceptuję{" "}
                  <Link
                    to="/regulamin"
                    className="text-orange-500 hover:text-orange-400 font-medium"
                  >
                    Regulamin
                  </Link>{" "}
                  i{" "}
                  <Link
                    to="/polityka-prywatnosci"
                    className="text-orange-500 hover:text-orange-400 font-medium"
                  >
                    Politykę Prywatności
                  </Link>
                  .
                </label>
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
              disabled={loading || !acceptedTerms}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-primary-foreground font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative z-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Tworzenie konta...
                </span>
              ) : (
                "Załóż konto"
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center pb-6">
          <div className="text-center space-y-3">
            <div>
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Masz już konto? Zaloguj się
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
