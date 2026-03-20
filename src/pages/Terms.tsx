import { useState } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "react-router-dom";

export default function Terms() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Paragonly</h1>
                <p className="text-xs text-muted-foreground">Twoje finanse</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Strona główna
              </Link>
              <Link
                to="/regulamin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Regulamin
              </Link>
              <Link
                to="/polityka-prywatnosci"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Polityka prywatności
              </Link>
              <Link
                to="/kontakt"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Kontakt
              </Link>
              <Link
                to="/login"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-6 py-2 rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
                style={{ cursor: "pointer" }}
              >
                Zaloguj się
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/login")}
                className="border-border/50 text-foreground hover:bg-muted"
              >
                Zaloguj się
              </Button>
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
                <Link
                  to="/"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Strona główna
                </Link>
                <Link
                  to="/regulamin"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Regulamin
                </Link>
                <Link
                  to="/polityka-prywatnosci"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Polityka prywatności
                </Link>
                <Link
                  to="/kontakt"
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Kontakt
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Powrót
            </button>
          </div>

          {/* Content */}
          <div className="bg-card border border-border/50 rounded-xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-3 rounded-lg">
                <FileText size={32} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Regulamin Serwisu
                </h1>
                <p className="text-sm text-muted-foreground">
                  Ostatnia aktualizacja: Marzec 2026
                </p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  1. Postanowienia ogólne
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Niniejszy regulamin (dalej: "Regulamin") określa zasady
                  korzystania z aplikacji internetowej Paragonly, dostępnej pod
                  adresem paragonly.pl (dalej: "Serwis").
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Usługodawcą i Administratorem Serwisu jest Adam Megger,
                  prowadzący działalność, NIP: 5591913403, adres e-mail:
                  adammegger@int.pl (dalej: "Usługodawca").
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Regulamin jest dokumentem, o którym mowa w art. 8 Ustawy z
                  dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Z Serwisu mogą korzystać osoby fizyczne posiadające pełną
                  zdolność do czynności prawnych (dalej: "Użytkownik").
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  2. Rodzaj i zakres świadczonych usług
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Serwis Paragonly służy do zarządzania finansami osobistymi, z
                  naciskiem na funkcję skanowania paragonów i analizę wydatków
                  budżetowych.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Usługodawca świadczy drogą elektroniczną usługi polegające na:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    umożliwieniu Użytkownikom założenia i utrzymywania
                    indywidualnego Konta w Serwisie (usługa bezpłatna),
                  </li>
                  <li>
                    umożliwieniu korzystania z zaawansowanych funkcji Serwisu,
                    takich jak skanowanie paragonów przy użyciu sztucznej
                    inteligencji, po wykupieniu płatnej Subskrypcji.
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Usługodawca zastrzega sobie prawo do wprowadzania nowych
                  funkcji, a także modyfikowania lub wycofywania dotychczasowych
                  usług po wcześniejszym poinformowaniu Użytkowników.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  3. Wymagania techniczne
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Do prawidłowego korzystania z Serwisu i jego usług niezbędne
                  jest:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    urządzenie z dostępem do sieci Internet (komputer, smartfon,
                    tablet),
                  </li>
                  <li>
                    zaktualizowana przeglądarka internetowa (np. Google Chrome,
                    Mozilla Firefox, Safari, Edge),
                  </li>
                  <li>
                    włączona obsługa języka JavaScript oraz plików Cookies,
                  </li>
                  <li>aktywny adres e-mail (niezbędny do założenia konta).</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  4. Rejestracja i warunki korzystania
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Dostęp do pełnej funkcjonalności Serwisu wymaga założenia
                  Konta poprzez podanie adresu e-mail oraz ustanowienie hasła.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Z chwilą skutecznej rejestracji Konta pomiędzy Użytkownikiem a
                  Usługodawcą zawarta zostaje umowa o świadczenie usług drogą
                  elektroniczną w zakresie bezpłatnego prowadzenia Konta.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Użytkownik zobowiązany jest do korzystania z Serwisu w sposób
                  zgodny z prawem, Regulaminem oraz dobrymi obyczajami, z
                  poszanowaniem praw autorskich oraz dóbr osobistych osób
                  trzecich.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Zakazane jest dostarczanie przez Użytkownika treści o
                  charakterze bezprawnym oraz podejmowanie działań mogących
                  wywołać zakłócenia w funkcjonowaniu Serwisu.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  5. Płatności i Subskrypcje
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Korzystanie z funkcji Premium w aplikacji (m.in. rozpoznawanie
                  paragonów przez AI) wiąże się z koniecznością wniesienia
                  opłaty subskrypcyjnej zgodnie z cennikiem dostępnym w
                  Serwisie.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Płatności w Serwisie obsługiwane są przez zewnętrznego
                  operatora (Stripe).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Subskrypcja odnawia się automatycznie na kolejne okresy
                  rozliczeniowe. Użytkownik może w każdej chwili anulować
                  subskrypcję w ustawieniach swojego Konta. Anulowanie odnosi
                  skutek na koniec bieżącego, opłaconego już okresu
                  rozliczeniowego.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Z chwilą zakupu usługi Premium Użytkownik wyraża zgodę na
                  wystawienie i przesłanie paragonu lub faktury VAT w formie
                  elektronicznej.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  6. Prawo do odstąpienia od umowy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Użytkownik będący Konsumentem ma prawo odstąpić od umowy o
                  świadczenie usług zawartej na odległość w terminie 14 dni bez
                  podawania przyczyny.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Bieg terminu do odstąpienia od umowy rozpoczyna się od dnia
                  zawarcia umowy (rejestracji lub zakupu subskrypcji).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Aby skorzystać z prawa odstąpienia od umowy, Użytkownik musi
                  poinformować Usługodawcę o swojej decyzji drogą e-mailową na
                  adres adammegger@int.pl.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Wyjątek: Jeżeli Użytkownik zażądał rozpoczęcia świadczenia
                  usług Premium przed upływem terminu do odstąpienia od umowy (i
                  usługa została w pełni wykonana lub rozpoczęto skanowanie
                  danych), Konsument traci prawo do odstąpienia od umowy z
                  chwilą pełnego wykonania usługi, o czym zostaje poinformowany
                  przed rozpoczęciem świadczenia.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  7. Tryb postępowania reklamacyjnego
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Użytkownik ma prawo składać reklamacje w sprawach dotyczących
                  działania Serwisu oraz płatności.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Reklamacje należy składać drogą elektroniczną na adres e-mail:
                  adammegger@int.pl.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  W zgłoszeniu reklamacyjnym należy podać co najmniej: adres
                  e-mail powiązany z kontem, opis problemu oraz żądanie
                  Użytkownika.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Usługodawca rozpatruje reklamacje w terminie 14 dni od daty
                  ich doręczenia. Odpowiedź na reklamację wysyłana jest na adres
                  e-mail, z którego została wysłana.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  8. Postanowienia końcowe
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Usługodawca zastrzega sobie prawo do zmiany niniejszego
                  Regulaminu z ważnych przyczyn (np. zmiana prawa, zmiana modelu
                  funkcjonowania Serwisu). O każdej zmianie Użytkownicy zostaną
                  poinformowani z co najmniej 14-dniowym wyprzedzeniem poprzez
                  komunikat w aplikacji lub wiadomość e-mail.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  W sprawach nieuregulowanych w niniejszym Regulaminie
                  zastosowanie mają przepisy prawa polskiego, w szczególności
                  Kodeksu cywilnego oraz Ustawy o prawach konsumenta.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
