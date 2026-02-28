import { useState } from "react";
import { supabase } from "../lib/supabase";
import AuthLayout from "./AuthLayout";

interface RegisterProps {
  onRegisterSuccess: () => void;
}

export default function Register({ onRegisterSuccess }: RegisterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      setSuccess(true);
      // Wait a moment then redirect to login
      setTimeout(() => {
        onRegisterSuccess();
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Błąd rejestracji. Spróbuj ponownie.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Załóż nowe konto">
      {success ? (
        <div className="text-center py-4">
          <div className="bg-green-500/10 border border-green-500/50 rounded-md p-4 mb-4">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Konto utworzone! Teraz możesz się zalogować.
            </p>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">
            Przekierowanie do logowania...
          </p>
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
              className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input"
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input"
              placeholder="••••••••"
            />
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
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-primary-foreground font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mb-8"
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

      <div className="absolute bottom-8 left-0 right-0 text-center">
        <div className="text-center space-y-3">
          <div>
            <button
              onClick={() => (window.location.href = "/login")}
              className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer"
            >
              Masz już konto? Zaloguj się
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
