import { useState, useEffect } from "react";
import { logger } from "../lib/logger";
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
import web from "assets/web.png";
import mobile from "assets/mobile.png";
import SuppiBadge from "../components/SuppiBadge";

// Import images for Bento Grid
import paragonImg from "../assets/paragon.png";
import budzetImg from "../assets/budzet.png";
import bioImg from "../assets/bio.png";
import historiaImg from "../assets/historia.png";
import obrazImg from "../assets/obraz.png";

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
        logger.error("Error checking session:", error);
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
                    Rozliczaj każdy produkt, nie tylko paragony.
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      {" "}
                      Z pomocą AI
                    </span>
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                    Skanuj paragony w sekundę. W przeciwieństwie do innych
                    aplikacji, Paragonly analizuje każdą pozycję osobno i
                    przypisuje ją do właściwej kategorii. Zobacz dokładnie, ile
                    wydajesz na jedzenie, a ile na chemię – nawet jeśli wszystko
                    kupiłeś w jednym markecie.
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
                      Kategoryzacja per produkt
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-lg">
                    <Check size={20} className="text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      Automatyczne tagi BIO
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-lg">
                    <Check size={20} className="text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      100% Prywatności
                    </span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] mt-10 lg:mt-0">
                {/* Web Dashboard - Duży na tytach */}
                <div className="absolute top-0 left-0 w-[85%] md:w-[90%] rounded-xl overflow-hidden border border-gray-800 shadow-2xl shadow-orange-500/20 bg-[#121212] z-10">
                  {/* Pasek przeglądarki */}
                  <div className="h-8 bg-gray-900 flex items-center px-4 gap-2 border-b border-gray-800">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <img
                    src={web}
                    alt="Dashboard webowy"
                    className="w-full h-auto object-cover"
                    style={{ opacity: 1 }} // BEZ PRZEZROCZYSTOŚCI!
                  />
                </div>

                {/* Mobile Scan - Duży, nałożony z boku z mocnym cieniem */}
                <div className="absolute bottom-[-20px] lg:bottom-[-40px] right-0 lg:right-[-20px] w-[260px] sm:w-[320px] rounded-[2rem] overflow-hidden border-4 border-gray-900 shadow-2xl shadow-cyan-500/40 bg-black z-20">
                  {/* Pasek telefonu (notch) */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-xl w-1/2 mx-auto z-30"></div>
                  <img
                    src={mobile}
                    alt="Skanowanie mobilne"
                    className="w-full h-auto object-cover relative z-20"
                  />
                </div>
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
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="h-48 w-full relative border-b border-gray-800/50 bg-[#0a0a0a] overflow-hidden group">
                  <img
                    src={paragonImg}
                    alt="Feature preview"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                  />
                </div>
                <div className="p-6 flex-1">
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-3 rounded-lg w-fit mb-4">
                    <Camera size={24} className="text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Skaner AI, który widzi więcej
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Kupiłeś w hipermarkecie chleb, płyn do szyb i skarpetki?
                    Zwykła aplikacja wrzuci całą kwotę w "Jedzenie", rujnując
                    Twoje statystyki. Paragonly czyta paragon linijka po
                    linijce. Chleb to Jedzenie, płyn to Auto, a skarpetki to
                    Ubrania. Koniec z zakłamanym budżetem.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Kategoryzacja na poziomie produktu
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Rozpoznawanie skrótów ze sklepów
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Koniec z ręcznym przepisywaniem
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="h-48 w-full relative border-b border-gray-800/50 bg-[#0a0a0a] overflow-hidden group">
                  <img
                    src={historiaImg}
                    alt="Feature preview"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                  />
                </div>
                <div className="p-6 flex-1">
                  <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-3 rounded-lg w-fit mb-4">
                    <Calendar size={24} className="text-cyan-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Śledzenie historii i inflacji
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Przestań zgadywać, czy w sklepie faktycznie jest taniej.
                    Paragonly zapamiętuje ceny Twoich ulubionych produktów na
                    przestrzeni czasu. Od razu sprawdzisz, jaka była najniższa i
                    najwyższa zapłacona cena, oraz wyłapiesz ukrytą inflację.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Historia cen pojedynczych produktów
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Śledzenie ulubionych zakupów
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Porównania
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="h-48 w-full relative border-b border-gray-800/50 bg-[#0a0a0a] overflow-hidden group">
                  <img
                    src={bioImg}
                    alt="Feature preview"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                  />
                </div>
                <div className="p-6 flex-1">
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3 rounded-lg w-fit mb-4">
                    <Leaf size={24} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Twój eko-ślad na paragonie
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Nasza sztuczna inteligencja automatycznie wyłapuje z
                    paragonów produkty ekologiczne (BIO, Eco, Organic). Zmieniaj
                    nawyki na zdrowsze, zbieraj Zielone Listki i odblokowuj
                    specjalne osiągnięcia w aplikacji.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Automatyczne flagowanie produktów BIO
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      System odznak i osiągnięć
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Świadome budowanie nawyków
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="h-48 w-full relative border-b border-gray-800/50 bg-[#0a0a0a] overflow-hidden group">
                  <img
                    src={budzetImg}
                    alt="Feature preview"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                  />
                </div>
                <div className="p-6 flex-1">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-3 rounded-lg w-fit mb-4">
                    <BarChart3 size={24} className="text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Budżety, które wreszcie działają
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Skoro precyzyjnie kategoryzujemy każdy produkt, Twoje limity
                    wydatków są w 100% dokładne. Ustaw osobne budżety na
                    rozrywkę, rachunki czy chemię domową i otrzymuj
                    powiadomienia, gdy zbliżasz się do granicy.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Kontrola wydatków na bieżąco
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Precyzyjne limity dla kategorii
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Szybkie reagowanie na przekroczenia
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="h-48 w-full relative border-b border-gray-800/50 bg-[#0a0a0a] overflow-hidden group">
                  <img
                    src={obrazImg}
                    alt="Feature preview"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                  />
                </div>
                <div className="p-6 flex-1">
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3 rounded-lg w-fit mb-4">
                    <Zap size={24} className="text-purple-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Prawdziwy obraz Twoich finansów
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Zapomnij o ogólnikach. Dzięki temu, że Paragonly zna każdy
                    pojedynczy produkt, nasze statystyki pokazują dokładnie to,
                    na co idą Twoje pieniądze. Generuj czytelne raporty
                    miesięczne, odkrywaj ukryte wzorce i łatwo eksportuj swoje
                    dane.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Szczegółowe raporty miesięczne
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Odkrywanie ukrytych kosztów
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Szybki eksport wydatków do CSV
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="h-48 w-full flex items-center justify-center relative border-b border-gray-800/50 bg-gradient-to-br from-gray-900 to-black overflow-hidden group">
                  <Shield className="w-20 h-20 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-6 flex-1">
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-3 rounded-lg w-fit mb-4">
                    <Shield size={24} className="text-yellow-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Twoje dane pod kluczem
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Wiemy, że Twoje wydatki to bardzo prywatna sprawa.
                    Wykorzystujemy najnowocześniejsze standardy szyfrowania bazy
                    danych, aby Twoje paragony były bezpieczne. Nie handlujemy
                    Twoimi nawykami zakupowymi – zarabiamy na planie PRO, a nie
                    na Twoich danych.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Zaawansowane szyfrowanie bazy
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      100% prywatności nawyków
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={16} className="text-green-500" />
                      Niezależność od reklamodawców
                    </li>
                  </ul>
                </div>
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
                      Nielimitowane skanowanie i kategoryzacja AI
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-500" />
                    <span className="text-foreground">
                      Nielimitowane budżety
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

        {/* Suppi Support Badge */}
        <SuppiBadge />
      </main>
    </div>
  );
}
