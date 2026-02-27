import { useState } from "react";
import { supabase } from "../lib/supabase";
import AuthLayout from "./AuthLayout";

interface ResetPasswordProps {
  onResetSuccess: () => void;
}

export default function ResetPassword({ onResetSuccess }: ResetPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      // Wait a moment then call success callback
      setTimeout(() => {
        onResetSuccess();
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Błąd podczas wysyłania linku. Spróbuj ponownie.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Resetowanie hasła">
      {success ? (
        <div className="text-center py-4">
          <div className="bg-green-500/10 border border-green-500/50 rounded-md p-4 mb-4">
            <p className="text-green-600 dark:text-green-400 font-medium">
              Wysłaliśmy link do resetu hasła na Twój e-mail.
            </p>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">
            Przekierowanie do logowania...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-primary-foreground font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
            <button
              onClick={() => (window.location.href = "/")}
              className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer"
            >
              Wróć do logowania
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
