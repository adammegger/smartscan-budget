import { useEffect } from "react";
import { Lock } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ProModalGateProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function ProModalGate({
  isOpen,
  onClose,
  title,
  message,
}: ProModalGateProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleUpgrade = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("No user found");
      return;
    }

    const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK;

    // Append the user's ID so the Stripe Webhook knows who paid
    const checkoutUrl = `${STRIPE_PAYMENT_LINK}?client_reference_id=${user.id}`;
    window.location.href = checkoutUrl;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-card border border-orange-500/30 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="text-center space-y-4">
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-3 rounded-full w-fit mx-auto cursor-pointer">
            <Lock size={32} className="text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {message}
          </p>
        </div>
        <div className="mt-6 space-y-3">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-foreground border border-border/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            Zamknij
          </button>
          <button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg cursor-pointer"
          >
            Odblokuj z PRO
          </button>
        </div>
      </div>
    </div>
  );
}
