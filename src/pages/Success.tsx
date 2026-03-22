import { useEffect, useState } from "react";
import { logger } from "../lib/logger";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ensureUserProfile } from "@/lib/profile";
import { CheckCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Confetti from "react-confetti";

export default function Success() {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshComplete, setRefreshComplete] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  useEffect(() => {
    const refreshProfileData = async () => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setIsRefreshing(true);

      // Wait 2-3 seconds to allow webhook to update the database
      await new Promise((resolve) => setTimeout(resolve, 2500));

      try {
        // Force refresh the profile data
        await ensureUserProfile();
        setRefreshComplete(true);
        logger.log("Profile data refreshed after successful payment");
      } catch (error) {
        logger.error("Error refreshing profile:", error);
      } finally {
        setIsRefreshing(false);
      }
    };

    refreshProfileData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-redirect countdown logic
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          // Navigate to dashboard when countdown reaches 0
          navigate("/dashboard");
          return 0;
        }
        return prevCountdown - 1;
      });
    }, 1000);

    // Clear interval on component unmount
    return () => {
      clearInterval(countdownInterval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Confetti Animation */}
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        recycle={false}
        numberOfPieces={200}
        colors={["#FF6B35", "#FF8C42", "#FFB74D", "#FFD54F", "#FFFFFF"]}
        gravity={0.15}
        initialVelocityX={2}
        initialVelocityY={-5}
        wind={0.01}
        run={true}
        style={{ position: "absolute", top: 0, left: 0, zIndex: 10 }}
      />

      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Content Card */}
      <Card className="w-full max-w-md shadow-xl relative z-20 bg-gray-800 rounded-2xl border border-gray-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-8">
            <CheckCircle className="h-20 w-20 text-green-400 drop-shadow-lg" />
          </div>

          <CardTitle className="text-3xl font-bold text-white tracking-wide">
            Dziękujemy za zakup Paragonly PRO!
          </CardTitle>
          <CardDescription className="text-gray-300 mt-4 text-lg font-medium">
            Twoje konto zostało uaktualnione
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Status Indicators */}
          {isRefreshing && (
            <div className="text-center text-sm text-gray-400 font-medium bg-gray-700/50 rounded-lg p-3 border border-gray-600/50">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                Aktualizowanie danych konta...
              </div>
            </div>
          )}

          {refreshComplete && (
            <div className="text-center text-sm text-orange-400 font-bold bg-orange-500/10 rounded-lg p-3 border border-orange-500/30">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">🎉</span>✅ Status konta
                zaktualizowany
              </div>
            </div>
          )}

          {/* Success Message */}
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-orange-200 text-center leading-relaxed">
              Masz teraz dostęp do wszystkich funkcji PRO. Ciesz się pełnym
              doświadczeniem Paragonly!
            </p>
          </div>

          {/* Main Action Button */}
          <Button
            onClick={handleGoToDashboard}
            className="w-full bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 hover:from-orange-600 hover:via-orange-700 hover:to-red-700 text-white font-bold text-lg py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 border-2 border-orange-400/50 shadow-lg shadow-orange-500/30"
          >
            <Home className="mr-3 h-5 w-5 text-white" />
            Przejdź do panelu
          </Button>

          {/* Footer Text */}
          <p className="text-xs text-gray-500 text-center opacity-80">
            Strona automatycznie przekieruje Cię za {countdown} sekund
          </p>
        </CardContent>
      </Card>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-orange-400/30 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}
