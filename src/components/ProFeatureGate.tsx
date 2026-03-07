import { Lock } from "lucide-react";
import { useDataCache } from "../lib/cacheUtils";

interface ProFeatureGateProps {
  children: React.ReactNode;
  fallbackMessage: string;
}

export default function ProFeatureGate({
  children,
  fallbackMessage,
}: ProFeatureGateProps) {
  const { userProfile } = useDataCache();

  // If userProfile is undefined (still loading), return null to prevent layout shifts
  if (!userProfile) {
    return null;
  }

  // If user is on PRO or PREMIUM tier, show the content
  if (
    userProfile?.subscription_tier === "pro" ||
    userProfile?.subscription_tier === "premium"
  ) {
    return <>{children}</>;
  }

  // If user is on FREE tier, show the locked state
  return (
    <div className="relative bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-8 text-center">
      {/* Simple gradient background without blur effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl"></div>

      <div className="relative z-10 space-y-6">
        {/* Lock Icon */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-4 rounded-full border border-orange-500/40">
            <Lock size={48} className="text-orange-500" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            Ta funkcja jest premium
          </h3>
          <p className="text-muted-foreground text-sm">{fallbackMessage}</p>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 shadow-lg border border-orange-500/50">
            Odblokuj z PRO
          </button>
        </div>
      </div>
    </div>
  );
}
