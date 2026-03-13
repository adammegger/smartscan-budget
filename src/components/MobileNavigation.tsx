import React, { useState, useEffect } from "react";
import {
  Calendar,
  Receipt,
  Wallet,
  BarChart3,
  ShoppingCart,
  Trophy,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDataCache } from "../lib/cacheUtils";
import { supabase } from "../lib/supabase";
import { ThemeToggle } from "../App";

interface MobileNavigationProps {
  onLogout: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useDataCache();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get user email from auth session
  useEffect(() => {
    const getUserEmail = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUserEmail();
  }, []);

  const navigationItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      icon: <Calendar size={20} />,
      label: "Dashboard",
    },
    {
      id: "receipts",
      path: "/dashboard/receipts",
      icon: <Receipt size={20} />,
      label: "Paragony",
    },
    {
      id: "budgets",
      path: "/dashboard/budgets",
      icon: <Wallet size={20} />,
      label: "Budżety",
    },
    {
      id: "priceHistory",
      path: "/dashboard/price-history",
      icon: <BarChart3 size={20} />,
      label: "Historia cen",
    },
    {
      id: "favoriteProducts",
      path: "/dashboard/favorite-products",
      icon: <ShoppingCart size={20} />,
      label: "Ulubione produkty",
    },
    {
      id: "achievements",
      path: "/dashboard/achievements",
      icon: <Trophy size={20} />,
      label: "Osiągnięcia",
    },
    {
      id: "profile",
      path: "/profile",
      icon: <User size={20} />,
      label: "Profil i ustawienia",
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      onLogout();
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Hamburger Button - visible only on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-card border border-border/50 hover:bg-muted transition-colors shadow-lg"
        aria-label="Otwórz menu"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-card border-r border-border/50 shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Profile Header Section */}
        <div className="flex items-center gap-3 p-4 mb-2 border-b border-border">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h2 className="font-semibold text-foreground truncate">
              Cześć, {userProfile?.first_name || "Użytkowniku"}!
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              {userEmail || "Brak danych"}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="ml-auto p-1 rounded-md hover:bg-muted transition-colors flex-shrink-0"
            aria-label="Zamknij menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Middle area: Navigation links */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                location.pathname === item.path
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span
                className={`${
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-border/50" />

        {/* Bottom area: Theme toggle and logout */}
        <div className="p-4 space-y-2">
          <ThemeToggle className="hidden" />
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={20} />
            <span className="font-medium">
              {isLoggingOut ? "Wylogowywanie..." : "Wyloguj"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
