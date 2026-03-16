import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ThemeProvider } from "../lib/theme";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [countdown, setCountdown] = useState(4);
  const [errorDetails, setErrorDetails] = useState<string>("");

  useEffect(() => {
    const verifySession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          setStatus("error");
          setErrorDetails("Błąd weryfikacji sesji");
          return;
        }

        if (!session) {
          setStatus("error");
          setErrorDetails("Brak aktywnej sesji");
          return;
        }

        // Check if email is confirmed
        if (!session.user.email_confirmed_at) {
          setStatus("error");
          setErrorDetails("Email nie został potwierdzony");
          return;
        }

        setStatus("success");
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setErrorDetails("Wystąpił nieoczekiwany błąd");
      }
    };

    verifySession();
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect based on status
          if (status === "success") {
            navigate("/dashboard");
          } else {
            navigate("/login");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  const handleManualRedirect = () => {
    if (status === "success") {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            {status === "loading" && (
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
            )}
            {status === "error" && (
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
            )}

            <CardTitle className="text-2xl font-bold text-foreground">
              {status === "loading" && "Weryfikowanie konta..."}
              {status === "success" && "Konto zostało aktywowane!"}
              {status === "error" && "Coś poszło nie tak"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {status === "success" && (
              <p className="text-center text-muted-foreground">
                Możesz teraz korzystać z Paragonly.
              </p>
            )}

            {status === "error" && (
              <div className="space-y-2">
                <p className="text-center text-muted-foreground">
                  Link mógł wygasnąć lub być już użyty.
                </p>
                {errorDetails && (
                  <p className="text-center text-sm text-red-500">
                    {errorDetails}
                  </p>
                )}
              </div>
            )}

            {status !== "loading" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Przekierowanie za:</span>
                  <span className="font-semibold text-foreground">
                    {countdown} sekund...
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(countdown / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleManualRedirect}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {status === "success"
                  ? "Przejdź do dashboardu"
                  : "Wróć do logowania"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
}
