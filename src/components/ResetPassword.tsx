import { useState } from "react";
import { supabase } from "../lib/supabase";
import AuthLayout from "./AuthLayout";
import { Link, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        },
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
      setLoading(false);
      // Wait a moment then redirect to login
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      if (err instanceof Error) {
        if (err.message.toLowerCase().includes("for security purposes")) {
          setError(
            "Ze względów bezpieczeństwa odczekaj chwilę przed kolejną próbą. Spróbuj ponownie za minutę.",
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Błąd podczas wysyłania linku. Spróbuj ponownie.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Resetowanie hasła" showLogo={true}>
      <div className="max-w-md mx-auto w-full">
        {success ? (
          <div className="text-center py-4">
            <div className="bg-green-500/10 border border-green-500/50 rounded-md p-4 mb-4">
              <p className="text-green-600 dark:text-green-400 font-medium">
                Wysłaliśmy link do resetu hasła na Twój e-mail.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Przekierowanie do logowania za 3 sekundy...
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
                className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input relative z-0"
                placeholder="twoj@email.com"
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
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-primary-foreground font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative z-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Wysyłanie...
                </span>
              ) : (
                "Wyślij link do resetu hasła"
              )}
            </button>
          </form>
        )}

        <div className="absolute bottom-8 left-0 right-0 text-center">
          <div className="text-center space-y-2">
            <div>
              <Link
                to="/login"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Wróć do logowania
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
