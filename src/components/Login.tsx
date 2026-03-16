import { useState } from "react";
import { supabase } from "../lib/supabase";
import AuthLayout from "./AuthLayout";
import { Link, useNavigate } from "react-router-dom";

interface LoginProps {
  onLoginSuccess: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Successful login - notify parent and let DashboardLayout handle navigation
      onLoginSuccess();
      // Navigate to dashboard after successful login
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      let errorMessage = "Błąd logowania. Spróbuj ponownie.";

      if (err instanceof Error) {
        const message = err.message.toLowerCase();

        switch (message) {
          case "invalid login credentials":
            errorMessage = "Nieprawidłowy adres e-mail lub hasło.";
            break;
          case "email not confirmed":
            errorMessage =
              "Potwierdź swój adres e-mail przed zalogowaniem. Sprawdź skrzynkę pocztową.";
            break;
          case "too many requests":
            errorMessage =
              "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.";
            break;
          case "user not found":
            errorMessage = "Nie znaleziono konta z tym adresem e-mail.";
            break;
          case "network":
            errorMessage =
              "Błąd połączenia. Sprawdź internet i spróbuj ponownie.";
            break;
          default:
            errorMessage = "Błąd logowania. Spróbuj ponownie.";
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Zaloguj się do swojego konta" showLogo={true}>
      <div className="max-w-md mx-auto w-full">
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-input relative z-0"
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
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-primary-foreground font-bold py-3 px-4 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative z-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                Logowanie...
              </span>
            ) : (
              "Zaloguj się"
            )}
          </button>
        </form>

        <div className="absolute bottom-8 left-0 right-0 text-center">
          <div className="text-center space-y-3">
            <div>
              <Link
                to="/reset-password"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Zapomniałeś hasła?
              </Link>
            </div>
            <div>
              <Link
                to="/register"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Nie masz konta? Zarejestruj się
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
