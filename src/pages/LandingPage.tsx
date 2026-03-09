import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Camera,
  BarChart3,
  Leaf,
  Zap,
  Calendar,
  Users,
  Shield,
  ArrowRight,
  Check,
  Star,
  Sparkles,
  Award,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Logo from "../components/Logo";
import {
  FREE_TIER_LIMITS,
  getBudgetsText,
  getReceiptsText,
} from "../lib/config";
import app1 from "assets/app1.png";

// Smooth scrolling function
const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkSession();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Logo className="h-12 w-auto" disableLink={true} />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("features")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Funkcje
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cennik
              </button>
              {session ? (
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mój Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Zaloguj się
                </Link>
              )}
              {session ? null : (
                <Button
                  onClick={() => navigate("/register")}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
                  style={{ cursor: "pointer" }}
                >
                  Rozpocznij za darmo
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              {session ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                  className="border-border/50 text-foreground hover:bg-muted"
                  style={{ cursor: "pointer" }}
                >
                  Wróć do aplikacji
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/register")}
                  className="border-border/50 text-foreground hover:bg-muted"
                  style={{ cursor: "pointer" }}
                >
                  Rozpocznij
                </Button>
              )}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-muted-foreground hover:text-foreground"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-border/50">
              <div className="py-4 space-y-4">
                <button
                  onClick={() => {
                    scrollToSection("features");
                    setIsMenuOpen(false);
                  }}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Funkcje
                </button>
                <button
                  onClick={() => {
                    scrollToSection("pricing");
                    setIsMenuOpen(false);
                  }}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cennik
                </button>
                <Link
                  to="/login"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Zaloguj się
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-16">
        {/* Hero */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-purple-500/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-sm text-orange-600 dark:text-orange-400">
                    <Sparkles size={16} />
                    <span>Nowość na rynku!</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                    Zarządzaj wydatkami
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      {" "}
                      z pomocą AI
                    </span>
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                    Skanuj paragony w sekundę, kontroluj budżet domowy i
                    zdobywaj nagrody za ekologiczne zakupy. Odkryj, gdzie
                    uciekają Twoje pieniądze.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {session ? null : (
                    <Button
                      onClick={() => navigate("/register")}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-3 rounded-full text-lg transition-all duration-200 hover:scale-105 shadow-lg"
                      style={{ cursor: "pointer" }}
                    >
                      Rozpocznij za darmo
                      <ArrowRight size={20} className="ml-3" />
                    </Button>
                  )}
                </div>

                {/* Features list */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-lg">
                    <Check size={20} className="text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      Szybkie skanowanie
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-lg">
                    <Check size={20} className="text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      Analiza AI
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-lg">
                    <Check size={20} className="text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      Oszczędzaj pieniądze
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="relative">
                {/* Main Screenshot Container */}
                <div className="relative z-10 rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card">
                  {/* Optional Mac-like window controls for a polished look */}
                  <div className="h-8 bg-muted/50 border-b border-border/50 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>

                  {/* The App Screenshot */}
                  <img
                    src={app1}
                    alt="Paragonly App Interface"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Decorative glowing background blobs (kept from original) */}
                <div className="absolute -top-6 -right-6 w-40 h-40 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-full blur-3xl -z-10"></div>
                <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Mocne strony Paragonly
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Odkryj jak nasza aplikacja może zmienić Twój sposób zarządzania
                finansami
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-card border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-3 rounded-lg w-fit mb-4">
                  <Camera size={24} className="text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Skaner AI
                </h3>
                <p className="text-muted-foreground mb-4">
                  Większość aplikacji widzi tylko kwotę całkowitą. Nasz Skaner
                  AI wyciąga każdy pojedynczy produkt z paragonu! Zapisujemy
                  całą Twoją listę zakupów, automatycznie przydzielając
                  konkretnym produktom ich własne kategorie budżetowe (np.
                  jedzenie, chemia).
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Skanowanie pojedynczych produktów
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Inteligentne kategorie per produkt
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Koniec z ręcznym przepisywaniem
                  </li>
                </ul>
              </div>

              {/* Feature 2 */}
              <div className="bg-card border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-3 rounded-lg w-fit mb-4">
                  <BarChart3 size={24} className="text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Inteligentne Budżety
                </h3>
                <p className="text-muted-foreground mb-4">
                  Twórz limity wydatków i śledź wahania cen ulubionych
                  produktów. Zawsze wiedz, ile wydajesz i gdzie możesz
                  zaoszczędzić.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Limitowanie wydatków
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Analiza cen
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Oszczędzanie
                  </li>
                </ul>
              </div>

              {/* Feature 3 */}
              <div className="bg-card border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3 rounded-lg w-fit mb-4">
                  <Leaf size={24} className="text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Grywalizacja i Ekologia
                </h3>
                <p className="text-muted-foreground mb-4">
                  Zdobywaj osiągnięcia i Zielone Listki za wybór produktów BIO.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Osiągnięcia
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Zielone Listki
                  </li>
                </ul>
              </div>

              {/* Feature 4 */}
              <div className="bg-card border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3 rounded-lg w-fit mb-4">
                  <Zap size={24} className="text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Analiza Wydatków
                </h3>
                <p className="text-muted-foreground mb-4">
                  Szczegółowe raporty i statystyki pokazujące, gdzie wydajesz
                  pieniądze. Odkryj ukryte wzorce i optymalizuj swoje wydatki.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Raporty miesięczne
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Analiza kategorii
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Trendy wydatków
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Eksport wydatków do CSV
                  </li>
                </ul>
              </div>

              {/* Feature 5 */}
              <div className="bg-card border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-3 rounded-lg w-fit mb-4">
                  <Calendar size={24} className="text-cyan-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Śledzenie Historii
                </h3>
                <p className="text-muted-foreground mb-4">
                  Śledź inflację na własnych oczach. Paragonly zapamiętuje ceny
                  Twoich ulubionych i najczęściej kupowanych produktów na
                  przestrzeni czasu, pokazując najniższą i najwyższą zapłaconą
                  cenę oraz trendy.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Archiwum paragonów
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Wyszukiwanie
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Porównania
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Wykresy historii cen produktów
                  </li>
                </ul>
              </div>

              {/* Feature 6 */}
              <div className="bg-card border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-3 rounded-lg w-fit mb-4">
                  <Shield size={24} className="text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Bezpieczeństwo i Prywatność
                </h3>
                <p className="text-muted-foreground mb-4">
                  Twoje dane są bezpieczne. Używamy najnowocześniejszych
                  technologii szyfrowania i nie udostępniamy Twoich danych
                  osobom trzecim.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Szyfrowanie danych
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Prywatność
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    Bezpieczeństwo
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Proste i Przejrzyste Opłaty
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Wybierz plan, który najlepiej odpowiada Twoim potrzebom
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="bg-card border border-border/50 rounded-xl p-8 hover:shadow-lg transition-all duration-300">
                <div className="text-center space-y-4">
                  <div className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 p-3 rounded-lg w-fit mx-auto">
                    <Users size={24} className="text-gray-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Plan Free
                  </h3>
                  <div className="text-4xl font-bold text-foreground">0 zł</div>
                  <p className="text-sm text-muted-foreground">Miesięcznie</p>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-500" />
                    <span className="text-foreground">
                      Do{" "}
                      {getReceiptsText(FREE_TIER_LIMITS.MAX_RECEIPTS_PER_MONTH)}{" "}
                      miesięcznie
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-500" />
                    <span className="text-foreground">
                      Do {getBudgetsText(FREE_TIER_LIMITS.MAX_BUDGETS)}{" "}
                      miesięcznie
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-500" />
                    <span className="text-foreground">
                      Podstawowy dashboard
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-500" />
                    <span className="text-foreground">
                      Zdobywanie osiągnięć
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-500" />
                    <span className="text-foreground">
                      Podstawowe statystyki
                    </span>
                  </div>
                </div>
              </div>

              {/* PRO Plan */}
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden cursor-pointer">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-bl-full"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-500/30 to-red-500/30 rounded-tr-full"></div>

                <div className="text-center space-y-4 relative z-10">
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-3 rounded-lg w-fit mx-auto">
                    <Award size={24} className="text-orange-500" />
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/40 rounded-full text-sm text-orange-600 dark:text-orange-400 mx-auto">
                    <Star size={16} />
                    <span>Polecany</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Plan PRO
                  </h3>
                  <div className="text-4xl font-bold text-foreground">
                    10 zł
                  </div>
                  <p className="text-sm text-muted-foreground">Miesięcznie</p>
                </div>

                <div className="mt-8 space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-500" />
                    <span className="text-foreground">
                      Wszystko z Planu Free
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-500" />
                    <span className="text-foreground">
                      Nielimitowane skanowanie paragonów
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-500" />
                    <span className="text-foreground">
                      Zaawansowana analiza wahań cen
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-500" />
                    <span className="text-foreground">Eksport do CSV</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-orange-500/10 to-red-500/10">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Gotowy na zmianę?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Dołącz do tysięcy użytkowników, którzy już oszczędzają dzięki
              Paragonly. Zarejestruj się już dziś i zacznij kontrolować swoje
              finanse!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? null : (
                <Button
                  onClick={() => navigate("/register")}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-3 rounded-full text-lg transition-all duration-200 hover:scale-105 shadow-lg"
                  style={{ cursor: "pointer" }}
                >
                  Rozpocznij za darmo
                  <ArrowRight size={20} className="ml-3" />
                </Button>
              )}
              {session ? null : (
                <Button
                  variant="outline"
                  size="lg"
                  className="border-border/50 text-foreground hover:bg-muted font-semibold px-8 py-3 rounded-full text-lg transition-all duration-200"
                  onClick={() => navigate("/login")}
                  style={{ cursor: "pointer" }}
                >
                  Masz już konto? Zaloguj się
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <Logo
                  className="h-10 w-auto opacity-75 hover:opacity-100 transition-opacity"
                  disableLink={true}
                />
                <p className="text-muted-foreground max-w-md mt-2">
                  Aplikacja do zarządzania finansami z zaawansowanym skanowaniem
                  paragonów i analizą wydatków.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4">Linki</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <button
                      onClick={() => scrollToSection("features")}
                      className="hover:text-foreground transition-colors cursor-pointer"
                    >
                      Funkcje
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => scrollToSection("pricing")}
                      className="hover:text-foreground transition-colors cursor-pointer"
                    >
                      Cennik
                    </button>
                  </li>
                  <li>
                    <Link
                      to="/login"
                      className="hover:text-foreground transition-colors"
                    >
                      Logowanie
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4">Prawo</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <Link
                      to="/regulamin"
                      className="hover:text-foreground transition-colors"
                    >
                      Regulamin
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/polityka-prywatnosci"
                      className="hover:text-foreground transition-colors"
                    >
                      Polityka prywatności
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/kontakt"
                      className="hover:text-foreground transition-colors"
                    >
                      Kontakt
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/faq"
                      className="hover:text-foreground transition-colors"
                    >
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border/50 mt-8 pt-8 text-center text-sm text-muted-foreground">
              <p>
                &copy;{" "}
                {new Date().getFullYear() === 2026
                  ? "2026"
                  : `2026 - ${new Date().getFullYear()}`}{" "}
                Paragonly. Wszelkie prawa zastrzeżone. Stworzone z pasją do
                finansów.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
