import { useState } from "react";
import { ArrowLeft, HelpCircle, Plus, Minus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "react-router-dom";

export default function Faq() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set());

  const toggleQuestion = (questionId: string) => {
    const newOpenQuestions = new Set(openQuestions);
    if (newOpenQuestions.has(questionId)) {
      newOpenQuestions.delete(questionId);
    } else {
      newOpenQuestions.add(questionId);
    }
    setOpenQuestions(newOpenQuestions);
  };

  const faqData = [
    {
      id: "account",
      category: "Konto i rejestracja",
      questions: [
        {
          id: "q1",
          question: "Jak założyć konto w Paragonly?",
          answer:
            "Aby założyć konto, kliknij przycisk 'Zarejestruj się' na stronie głównej. Wypełnij formularz rejestracyjny, podając adres e-mail i hasło. Po rejestracji otrzymasz e-mail weryfikacyjny.",
        },
        {
          id: "q2",
          question: "Jak zmienić hasło do konta?",
          answer:
            "Aby zmienić hasło, przejdź do strony logowania, wybierz 'Zapomniałeś hasła?', wpisz e-mail. Po zatwierdzeniu sprawdź skrzynkę pocztową.",
        },
        {
          id: "q3",
          question: "Co zrobić, jeśli zapomniałem hasła?",
          answer:
            "Kliknij 'Przypomnij hasło' na stronie logowania i podaj swój adres e-mail. Wyślemy Ci instrukcje dotyczące zresetowania hasła.",
        },
      ],
    },
    {
      id: "scanning",
      category: "Skanowanie paragonów",
      questions: [
        {
          id: "q4",
          question: "Jak skanować paragon?",
          answer:
            "Kliknij przycisk 'Skanuj paragon' w aplikacji, a następnie uchwyć paragon kamerą. Upewnij się, że paragon jest dobrze oświetlony i czytelny. Aplikacja automatycznie rozpozna dane z paragonu. A jeśli nie, możesz przed zatwierdzeniem edytować dane. Po wprowadzeniu zatwierdź wprowadzone zmiany.",
        },
        {
          id: "q5",
          question: "Czy mogę skanować stare paragony?",
          answer:
            "Tak, możesz skanować paragony z dowolnej daty. Wystarczy, że będą one dobrze widoczne i czytelne na zdjęciu.",
        },
        {
          id: "q6",
          question: "Co zrobić, jeśli skanowanie nie powiodło się?",
          answer:
            "Spróbuj ponownie, upewniając się, że paragon jest dobrze oświetlony i czytelny.",
        },
      ],
    },
    {
      id: "budgets",
      category: "Budżety i wydatki",
      questions: [
        {
          id: "q7",
          question: "Jak tworzyć budżety?",
          answer:
            "Przejdź do sekcji 'Budżety' i dodaj budżet z wybranej kategorii. Ustal limit i zatwierdź. Aktywny limit pojawi się na szczycie sekcji.",
        },
        {
          id: "q8",
          question: "Czy mogę edytować istniejące budżety?",
          answer:
            "Tak, możesz edytować lub usunąć każdy budżet w sekcji 'Budżety'. Kliknij na wybrany budżet, aby zmienić jego limit lub go usunąć.",
        },
      ],
    },
    {
      id: "security",
      category: "Bezpieczeństwo i prywatność",
      questions: [
        {
          id: "q10",
          question: "Czy moje dane są bezpieczne?",
          answer:
            "Tak, Twoje dane są szyfrowane i przechowywane zgodnie z obowiązującymi przepisami o ochronie danych osobowych. Nie udostępniamy Twoich danych osobom trzecim.",
        },
        {
          id: "q11",
          question: "Jakie dane są przetwarzane?",
          answer:
            "Przetwarzamy dane rejestracyjne (e-mail, imię), dane finansowe (paragony, wydatki, budżety) oraz dane techniczne (adres IP, informacje o urządzeniu).",
        },
        {
          id: "q12",
          question: "Czy mogę usunąć swoje konto?",
          answer:
            "Tak, możesz usunąć swoje konto w każdej chwili. Pamiętaj, że usunięcie konta jest nieodwracalne i spowoduje utratę wszystkich danych.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-xl">
                <HelpCircle size={24} className="text-white" />
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

          {/* Header */}
          <div className="bg-card border border-border/50 rounded-xl p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-3 rounded-lg">
                <HelpCircle size={32} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Najczęściej zadawane pytania
                </h1>
                <p className="text-sm text-muted-foreground">
                  Znajdź odpowiedzi na najczęściej zadawane pytania
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                Wszystkie kategorie
              </span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                15 pytań
              </span>
            </div>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-6">
            {faqData.map((category) => (
              <div
                key={category.id}
                className="bg-card border border-border/50 rounded-xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-6 border-b border-border/50">
                  <h2 className="text-xl font-semibold text-foreground">
                    {category.category}
                  </h2>
                </div>

                <div className="divide-y divide-border/50">
                  {category.questions.map((faq) => (
                    <div key={faq.id} className="p-6">
                      <button
                        onClick={() => toggleQuestion(faq.id)}
                        className="flex items-center justify-between w-full text-left group cursor-pointer"
                      >
                        <span className="text-lg font-medium text-foreground group-hover:text-orange-500 transition-colors cursor-pointer">
                          {faq.question}
                        </span>
                        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-2 rounded-lg cursor-pointer">
                          {openQuestions.has(faq.id) ? (
                            <Minus size={20} className="text-orange-500" />
                          ) : (
                            <Plus size={20} className="text-orange-500" />
                          )}
                        </div>
                      </button>

                      <div
                        className={`mt-4 text-muted-foreground transition-all duration-300 overflow-hidden ${
                          openQuestions.has(faq.id)
                            ? "max-h-96 opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="mt-12 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Nie znalazłeś odpowiedzi?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Jeśli nie znalazłeś odpowiedzi na swoje pytanie, skontaktuj się
                z nami.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/kontakt"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-3 rounded-full transition-all duration-200 hover:scale-105 shadow-lg"
                  style={{ cursor: "pointer" }}
                >
                  Skontaktuj się z nami
                </Link>
                <Link
                  to="/login"
                  className="border-border/50 text-foreground hover:bg-muted font-semibold px-8 py-3 rounded-full transition-all duration-200"
                  style={{ cursor: "pointer" }}
                >
                  Zaloguj się do aplikacji
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
