import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import {
  ACHIEVEMENTS,
  fetchUserAchievements,
  checkAchievements,
  getAchievementIcon,
} from "../lib/achievements";
import type {
  AchievementDefinition,
  UserAchievement,
} from "../lib/achievements";
import { supabase } from "../lib/supabase";

interface AchievementsProps {
  onAchievementEarned?: (achievement: AchievementDefinition) => void;
}

export default function Achievements({
  onAchievementEarned,
}: AchievementsProps) {
  const [, setUserAchievements] = useState<UserAchievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch user achievements on mount
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Check and award any achievements that should be earned
          await checkAchievements(user.id);

          const achievements = await fetchUserAchievements(user.id);
          setUserAchievements(achievements);
          setEarnedIds(new Set(achievements.map((a) => a.type)));
        }
      } catch (error) {
        console.error("Error loading achievements:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, []);

  // Trigger confetti when a new achievement is earned
  const triggerConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#ff6b6b", "#ffa502", "#ff7f50", "#ff4757"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#ff6b6b", "#ffa502", "#ff7f50", "#ff4757"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  // Check for new achievements and trigger confetti
  useEffect(() => {
    // This would be called after a receipt is scanned
    const checkNewAchievements = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const newAchievements = await checkAchievements(user.id);

          if (newAchievements.length > 0) {
            // Find the achievement definitions
            const earnedDefinitions = ACHIEVEMENTS.filter((a) =>
              newAchievements.includes(a.id),
            );

            // Refresh the list
            const achievements = await fetchUserAchievements(user.id);
            setUserAchievements(achievements);
            setEarnedIds(new Set(achievements.map((a) => a.type)));

            // Trigger confetti for each new achievement
            earnedDefinitions.forEach((achievement, index) => {
              setTimeout(() => {
                triggerConfetti();
                onAchievementEarned?.(achievement);
              }, index * 500);
            });
          }
        }
      } catch (error) {
        console.error("Error checking achievements:", error);
      }
    };

    // Expose the check function globally so Scanner can call it
    (
      window as unknown as { checkAchievementsAndUpdate: () => Promise<void> }
    ).checkAchievementsAndUpdate = checkNewAchievements;
  }, [onAchievementEarned]);

  const getIcon = (iconName: string) => {
    return getAchievementIcon(iconName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const earnedCount = earnedIds.size;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="bg-card border border-border/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="text-orange-500" size={24} />
            Twoje Osiągnięcia
          </h2>
          <span className="text-sm text-muted-foreground">
            {earnedCount} / {totalCount}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ease-out"
            style={{ width: `${(earnedCount / totalCount) * 100}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          Zdobywaj odznaki skanując paragony i oszczędzaj mądrze!
        </p>
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {ACHIEVEMENTS.map((achievement) => {
          const isEarned = earnedIds.has(achievement.id);
          const Icon = getIcon(achievement.icon);

          return (
            <div
              key={achievement.id}
              className={`relative group bg-card border rounded-xl p-4 transition-all duration-300 ${
                isEarned
                  ? "border-orange-500/50 shadow-lg shadow-orange-500/10 bg-gradient-to-br from-orange-500/10 to-red-500/10"
                  : "border-border opacity-60"
              }`}
            >
              {/* Achievement icon */}
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3">
                <div
                  className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${
                    isEarned
                      ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon size={32} className={isEarned ? "animate-pulse" : ""} />
                </div>
              </div>

              {/* Achievement name */}
              <h3
                className={`text-sm font-semibold text-center mb-1 transition-colors duration-300 ${
                  isEarned
                    ? "text-orange-600 font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {achievement.name}
              </h3>

              {/* Achievement description */}
              <p className="text-xs text-muted-foreground text-center">
                {achievement.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Motivational message */}
      {earnedCount === 0 && (
        <div className="text-center p-6 bg-muted/50 rounded-xl">
          <p className="text-muted-foreground">
            🚀 Skanuj swój pierwszy paragon, aby zdobyć pierwszą odznakę!
          </p>
        </div>
      )}

      {earnedCount > 0 && earnedCount < totalCount && (
        <div className="text-center p-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
          <p className="text-foreground">
            💪 Świetnie! Masz już{" "}
            <span className="font-bold text-orange-500">{earnedCount}</span>{" "}
            odznak.
            {!earnedIds.has("streak_7_days") &&
              " Skanuj paragony 7 dni z rzędu, aby zdobyć serię tygodniową!"}
          </p>
        </div>
      )}

      {earnedCount === totalCount && (
        <div className="text-center p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
          <p className="text-foreground font-bold">
            🏆 Jesteś Mistrzem Finansów! Zdobyłeś wszystkie odznaki!
          </p>
        </div>
      )}
    </div>
  );
}
