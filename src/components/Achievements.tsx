import { useEffect, useState } from "react";
import {
  Trophy,
  Zap,
  ShieldCheck,
  Flame,
  Target,
  Star,
  Award,
  TrendingUp,
  ShoppingBag,
  Leaf,
  Clover,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  ACHIEVEMENTS,
  fetchUserAchievements,
  checkAchievements,
  fetchUserProgressData,
  getProgressValue,
} from "../lib/achievements";
import type {
  AchievementDefinition,
  UserAchievement,
  UserProgressData,
} from "../lib/achievements";
import { supabase } from "../lib/supabase";

// Icon mapping
const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  Trophy,
  Zap,
  ShieldCheck,
  Flame,
  Target,
  Star,
  Award,
  TrendingUp,
  ShoppingBag,
  Leaf,
  Clover,
};

interface AchievementsProps {
  onAchievementEarned?: (achievement: AchievementDefinition) => void;
}

export default function Achievements({
  onAchievementEarned,
}: AchievementsProps) {
  const [, setUserAchievements] = useState<UserAchievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<UserProgressData>({
    totalReceipts: 0,
    totalSpent: 0,
    uniqueCategories: 0,
    budgetsCreated: 0,
    streak: 0,
    greenLeaves: 0,
  });

  // Fetch user achievements on mount
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const achievements = await fetchUserAchievements(user.id);
          setUserAchievements(achievements);
          setEarnedIds(new Set(achievements.map((a) => a.type)));

          // Fetch progress data for badges
          const progress = await fetchUserProgressData(user.id);
          setProgressData(progress);
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
    return iconMap[iconName] || Trophy;
  };

  // Calculate progress for each achievement
  const getProgress = (achievement: AchievementDefinition): number => {
    if (earnedIds.has(achievement.id)) return 100;

    const currentValue = getProgressValue(
      achievement.requirement,
      progressData,
    );
    const percentage = Math.min(
      (currentValue / achievement.threshold) * 100,
      100,
    );
    return percentage;
  };

  // Get badge display value for an achievement
  const getBadgeValue = (achievement: AchievementDefinition): number | null => {
    // Don't show badge if achievement is earned
    if (earnedIds.has(achievement.id)) return null;

    const currentValue = getProgressValue(
      achievement.requirement,
      progressData,
    );

    // Don't show badge if no progress yet
    if (currentValue <= 0) return null;

    // Don't show badge if already reached threshold (should be earned)
    if (currentValue >= achievement.threshold) return null;

    return currentValue;
  };

  // Check if this is a countable achievement (should show badge)
  const isCountableAchievement = (
    achievement: AchievementDefinition,
  ): boolean => {
    const countableRequirements = [
      "total_receipts",
      "total_spent",
      "unique_categories",
      "budgets_created",
      "streak_7_days",
      "streak_30_days",
      "green_leaves",
      "first_receipt",
    ];
    return countableRequirements.includes(achievement.requirement);
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
      <div className="bg-card border border-border rounded-xl p-6">
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
          const badgeValue = getBadgeValue(achievement);
          const showBadge =
            isCountableAchievement(achievement) && badgeValue !== null;

          return (
            <div
              key={achievement.id}
              className={`relative group bg-card border rounded-xl p-4 transition-all duration-300 ${
                isEarned
                  ? "border-orange-500/50 shadow-lg shadow-orange-500/10"
                  : "border-border opacity-60"
              }`}
            >
              {/* Badge icon with progress counter */}
              <div className="relative w-16 h-16 mx-auto mb-3">
                <div
                  className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 ${
                    isEarned
                      ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon size={32} className={isEarned ? "animate-pulse" : ""} />
                </div>

                {/* Progress badge - shows current count */}
                {showBadge && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-background">
                    <span className="text-[10px] font-bold text-white leading-none">
                      {badgeValue}
                    </span>
                  </div>
                )}
              </div>

              {/* Badge name */}
              <h3
                className={`text-sm font-semibold text-center mb-1 ${
                  isEarned ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {achievement.name}
              </h3>

              {/* Badge description */}
              <p className="text-xs text-muted-foreground text-center">
                {achievement.description}
              </p>

              {/* Earned indicator */}
              {isEarned && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>
              )}

              {/* Hover tooltip with progress */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-muted rounded-b-xl overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isEarned
                      ? "bg-gradient-to-r from-orange-500 to-red-500"
                      : "bg-muted-foreground/30"
                  }`}
                  style={{ width: `${getProgress(achievement)}%` }}
                />
              </div>
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
