import { useState } from "react";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { Link, useNavigate } from "react-router-dom";

export default function Privacy() {
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
                <Shield size={24} className="text-white" />
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
                <Shield size={32} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Polityka Prywatności
                </h1>
                <p className="text-sm text-muted-foreground">
                  Ostatnia aktualizacja: Marzec 2026
                </p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  § 1 Postanowienia ogólne
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Administratorem danych osobowych jest firma Adam Megger, z
                  siedzibą przy Osiedle Jagiellońskie 28/23, o numerze NIP:
                  5591913403. Z Adam Megger można kontaktować się pisemnie na
                  adres wskazany w zdaniu poprzedzającym lub drogą e-mailową na
                  adres: adammegger@int.pl.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Na podstawie Art. 37 RODO, firma "Adam Megger" nie powołała
                  Inspektora Ochrony Danych.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Polityka prywatności stanowi integralną część Regulaminu.
                  Korzystając z oferowanych przez nas usług, powierzasz nam
                  swoje informacje. Niniejszy dokument służy jedynie jako pomoc
                  w zrozumieniu, jakie informacje i dane są zbierane i w jakim
                  celu oraz do czego są wykorzystywane. Te dane są bardzo dla
                  nas ważne, dlatego prosimy o dokładne zapoznanie się z tym
                  dokumentem gdyż określa on zasady oraz sposoby przetwarzania i
                  ochrony danych osobowych. Dokument ten określa także zasady
                  stosowania plików „Cookies”.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Informujemy, że przestrzegamy zasad ochrony danych osobowych
                  oraz wszelkich uregulowań prawnych, które są przewidziane
                  Ustawą o ochronie danych osobowych oraz Rozporządzeniem
                  Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27
                  kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z
                  przetwarzaniem danych osobowych i w sprawie swobodnego
                  przepływu takich danych oraz uchylenia dyrektywy 95/46/WE.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Na żądanie osoby, której dane osobowe są przetwarzane
                  udzielamy wyczerpujących informacji w jaki sposób
                  wykorzystujemy jego dane osobowe. Zawsze w jasny sposób
                  staramy się poinformować o danych, które gromadzimy, w jaki
                  sposób je wykorzystujemy, jakim celom mają służyć i komu je
                  przekazujemy, jaką zapewniamy ochronę tych danych przy
                  przekazaniu innym podmiotom oraz udzielamy informacji o
                  instytucjach, z którymi należy się skontaktować w razie
                  wątpliwości.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  § 2 Zasady prywatności
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Szanujemy Twoją prywatność. Pragniemy zagwarantować Ci wygodę
                  korzystania z naszych usług.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Cenimy zaufanie, jakim Nas obdarzasz, powierzając nam swoje
                  dane osobowe w celu realizacji usług. Zawsze korzystamy z
                  danych osobowych w sposób uczciwy oraz tak, aby nie zawieść
                  Twojego zaufania, tylko w zakresie niezbędnym do realizacji
                  usług.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Jako Użytkownik masz prawo do uzyskania pełnych i jasnych
                  informacji o tym, w jaki sposób wykorzystujemy Twoje dane
                  osobowe i do jakich celów są niezbędne. Zawsze w klarowny
                  sposób informujemy o danych, które zbieramy, w jaki sposób i
                  komu je udostępniamy oraz udzielamy informacji o podmiotach, z
                  którymi należy się skontaktować w razie wątpliwości.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  W razie wątpliwości odnośnie wykorzystywania przez nas Twoich
                  danych osobowych, niezwłocznie podejmiemy działania w celu
                  wyjaśnienia i rozwiania takich wątpliwości. W sposób
                  wyczerpujący odpowiadamy na wszystkie pytania z tym związane.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Podejmiemy wszystkie uzasadnione działania, aby chronić Twoje
                  dane przed nienależytym i niekontrolowanym wykorzystaniem.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Podstawą prawną przetwarzania Twoich danych osobowych jest:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    art. 6 ust. 1 lit. a: osoba, której dane dotyczą wyraziła
                    zgodę na przetwarzanie swoich danych osobowych w jednym lub
                    większej liczbie określonych celów,
                  </li>
                  <li>
                    art. 6 ust. 1 lit. b: przetwarzanie jest niezbędne do
                    wykonania umowy, której stroną jest osoba, której dane
                    dotyczą, lub do podjęcia działań na żądanie osoby, której
                    dane dotyczą, przed zawarciem umowy,
                  </li>
                  <li>
                    art. 6 ust. 1 lit. c: przetwarzanie jest niezbędne do
                    wypełnienia obowiązku prawnego ciążącego na administratorze,
                  </li>
                  <li>
                    art. 6 ust. 1 lit. f: przetwarzanie jest niezbędne do celów
                    wynikających z prawnie uzasadnionych interesów realizowanych
                    przez administratora lub przez stronę trzecią.
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Twoje dane osobowe związane z zawarciem i realizacją umowy
                  przetwarzane będą przez okres jej realizacji, a także przez
                  okres nie dłuższy niż przewidują to przepisy prawa, w tym
                  przepisy Kodeksu cywilnego oraz ustawy o rachunkowości, tj.
                  nie dłużej niż przez 10 lat, licząc od końca roku
                  kalendarzowego w którym ostatnia umowa została wykonana.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Twoje dane osobowe przetwarzane w celu zawarcia i wykonania
                  przyszłych umów będą przetwarzane do czasu zgłoszenia
                  sprzeciwu.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Przysługuje Ci prawo do: dostępu do swoich danych osobowych i
                  otrzymania kopii danych osobowych podlegających przetwarzaniu,
                  sprostowania swoich nieprawidłowych danych; żądania usunięcia
                  danych (prawo do bycia zapomnianym) w przypadku wystąpienia
                  okoliczności przewidzianych w art. 17 RODO; żądania
                  ograniczenia przetwarzania danych w przypadkach wskazanych w
                  art. 18 RODO, wniesienia sprzeciwu wobec przetwarzania danych
                  w przypadkach wskazanych w art. 21 RODO, przenoszenia
                  dostarczonych danych, przetwarzanych w sposób zautomatyzowany.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Jeżeli uważasz, że Twoje dane osobowe są przetwarzane
                  niezgodnie z prawem, możecie wnieść skargę do organu
                  nadzorczego (Urząd Ochrony Danych Osobowych, ul. Stawki 2,
                  Warszawa). Jeśli potrzebujesz dodatkowych informacji
                  związanych z ochroną danych osobowych lub chcesz skorzystać z
                  przysługujących praw, skontaktuj się z nami listownie na adres
                  korespondencyjny.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Przestrzegamy wszystkich obowiązujących przepisów i regulacji
                  dotyczących ochrony danych i będziemy współpracować z organami
                  zajmującymi się ochroną danych oraz uprawnionymi do tego
                  organami ścigania. W przypadku braku przepisów dotyczących
                  ochrony danych, będziemy postępować zgodnie z ogólnie
                  przyjętymi zasadami ochrony danych, zasadami współżycia
                  społecznego jak i ustalonymi zwyczajami.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  W razie pytań, zapraszamy do kontaktu za pomocą strony, z
                  której zostałeś przekierowany do niniejszej Polityki
                  prywatności. Prośba o kontakt zostanie niezwłocznie przekazana
                  do odpowiedniej powołanej do tego osoby.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Aby ułatwić nam odpowiedź bądź ustosunkowanie się do podanych
                  informacji, prosimy o podanie imienia i nazwiska.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  § 3 Zakres i cel zbierania danych osobowych
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Przetwarzamy niezbędne dane osobowe w celu realizacji usług
                  oraz w celach księgowych i tylko takich.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Zbieramy, przetwarzamy i przechowujemy następujące dane
                  użytkowników:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>imię i nazwisko,</li>
                  <li>adres zamieszkania,</li>
                  <li>numer identyfikacji podatkowej (NIP),</li>
                  <li>adres poczty elektronicznej (e-mail),</li>
                  <li>informacje o używanej przeglądarce internetowej,</li>
                  <li>inne dobrowolnie przekazane nam dane osobowe.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Podanie powyższych danych przez jest całkowicie dobrowolne ale
                  także i niezbędne do pełnej realizacji usług.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Możemy przesyłać dane osobowe do serwerów znajdujących się
                  poza krajem Twojego zamieszkania lub do podmiotów powiązanych,
                  stron trzecich z siedzibą w innych krajach w tym krajach z
                  obszaru EOG (Europejski Obszar Gospodarczy, EOG ang. European
                  Economic Area, EEA – strefa wolnego handlu i Wspólny Rynek,
                  obejmujące państwa Unii Europejskiej i Europejskiego
                  Stowarzyszenia Wolnego Handlu EFTA) w celu przetwarzania
                  danych osobowych przez takie podmioty w naszym imieniu zgodnie
                  z postanowieniami niniejszej Polityki prywatności oraz
                  obowiązującymi przepisami prawa, zwyczajami jak i regulacjami
                  dotyczącymi ochrony danych.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Dostęp do Twoich danych mogą posiadać podmioty świadczące
                  usługi niezbędne do prowadzenia serwisu tj.:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    Firmy hostingowe, świadczące usługi hostingu lub usług
                    pokrewnych dla Administratora,
                  </li>
                  <li>
                    Firmy, za pośrednictwem których świadczona jest usługa
                    Newslettera,
                  </li>
                  <li>
                    Firmy serwisowe i wsparcia IT dokonujące konserwacji lub
                    odpowiedzialne za utrzymanie infrastruktury IT,
                  </li>
                  <li>
                    Firmy pośredniczące w płatnościach on-line za towary lub
                    usługi oferowane w ramach Serwisu (w przypadku dokonywania
                    transakcji zakupu w Serwisie),
                  </li>
                  <li>
                    Firmy pośredniczące w płatnościach mobilnych za towary lub
                    usługi oferowane w ramach Serwisu (w przypadku dokonywania
                    transakcji zakupu w Serwisie),
                  </li>
                  <li>
                    Firmy odpowiedzialne za prowadzenie księgowości
                    Administratora (w przypadku dokonywania transakcji zakupu w
                    Serwisie).
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  § 4 Pliki Cookie
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Stosuje pliki cookie lub podobne technologie (zwane dalej
                  łącznie: „plikami cookie”) poprzez które należy rozumieć dane
                  informatyczne, w szczególności pliki tekstowe, przeznaczone do
                  korzystania ze strony internetowej i przechowywane w
                  urządzeniach końcowych Użytkowników przeglądających strony.
                  Informacje zbierane przy pomocy plików cookie pozwalają
                  dostosowywać usługi i treści do indywidualnych potrzeb, a
                  także preferencji użytkowników, jak również służą do
                  opracowywania ogólnych statystyk dotyczących korzystania przez
                  użytkowników ze stron. Dane gromadzone przy użyciu plików
                  cookie są zbierane wyłącznie w celu wykonywania określonych
                  funkcji na rzecz Użytkowników i są zaszyfrowane w sposób
                  uniemożliwiający dostęp do nich osobom nieuprawnionym.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Na naszej stronie stosujemy pliki cookie:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    Cookies wewnętrzne - pliki zamieszczane i odczytywane z
                    Urządzenia Użytkownika przez system teleinformatyczny
                    Serwisu,
                  </li>
                  <li>
                    Cookies zewnętrzne - pliki zamieszczane i odczytywane z
                    Urządzenia Użytkownika przez systemy teleinformatyczne
                    Serwisów zewnętrznych. Skrypty Serwisów zewnętrznych, które
                    mogą umieszczać pliki Cookies na Urządzeniach Użytkownika
                    zostały świadomie umieszczone w Serwisie poprzez skrypty i
                    usługi udostępnione i zainstalowane w Serwisie,
                  </li>
                  <li>
                    Cookies sesyjne - pliki zamieszczane i odczytywane z
                    Urządzenia Użytkownika przez Serwis podczas jednej sesji
                    danego Urządzenia. Po zakończeniu sesji pliki są usuwane z
                    Urządzenia Użytkownika,
                  </li>
                  <li>
                    Cookies trwałe - pliki zamieszczane i odczytywane z
                    Urządzenia Użytkownika przez Serwis do momentu ich ręcznego
                    usunięcia. Pliki nie są usuwane automatycznie po zakończeniu
                    sesji Urządzenia chyba że konfiguracja Urządzenia
                    Użytkownika jest ustawiona na tryb usuwanie plików Cookie po
                    zakończeniu sesji Urządzenia.
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  W ramach naszej strony internetowej, stosowane są następujące
                  rodzaje plików cookie ze względu na niezbędność do realizacji
                  usług:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    niezbędne pliki cookie, umożliwiające korzystanie z usług
                    dostępnych w ramach strony internetowej, w szczególności
                    uwierzytelniające pliki cookie wykorzystywane do usług
                    wymagających uwierzytelnienia;
                  </li>
                  <li>
                    pliki cookie służące do zapewnienia bezpieczeństwa, w
                    szczególności wykorzystywane do wykrywania nadużyć w
                    zakresie uwierzytelniania;
                  </li>
                  <li>
                    wydajnościowe pliki cookie, umożliwiające zbieranie
                    informacji o sposobie korzystania ze stron internetowych;
                  </li>
                  <li>
                    funkcjonalne pliki cookie, umożliwiające „zapamiętanie”
                    wybranych przez użytkownika ustawień i personalizację
                    interfejsu użytkownika;
                  </li>
                  <li>
                    reklamowe pliki cookie, umożliwiające dostarczanie
                    użytkownikom treści reklamowych dostosowanych do ich
                    zainteresowań.
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Oprogramowanie do przeglądania stron internetowych
                  (przeglądarka internetowa) zazwyczaj domyślnie dopuszcza
                  przechowywanie plików cookie w urządzeniu końcowym. Użytkownik
                  przeglądający stronę internetową może samodzielnie i w każdym
                  czasie zmienić ustawienia dotyczące plików cookie, określając
                  warunki ich przechowywania i uzyskiwania dostępu przez pliki
                  cookie do swojego urządzenia. Zmiany ustawień, o których mowa
                  w zdaniu poprzednim, Klient może dokonać za pomocą ustawień
                  przeglądarki internetowej. Ustawienia te mogą zostać zmienione
                  w szczególności w taki sposób, aby blokować automatyczną
                  obsługę plików cookie w ustawieniach przeglądarki internetowej
                  bądź informować o ich każdorazowym zamieszczeniu plików cookie
                  na urządzeniu Użytkownika. Szczegółowe informacje o możliwości
                  i sposobach obsługi plików cookie dostępne są w ustawieniach
                  oprogramowania (przeglądarki internetowej).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Korzystanie ze strony internetowej, bez zmiany ustawień w
                  zakresie plików cookie, oznacza wyrażenie zgody na zapisywanie
                  plików cookie. Klient zawsze może wycofać zgodę poprzez zmianę
                  ustawień dotyczących plików cookie.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  § 5 Prawa i obowiązki
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Mamy prawo a w przypadkach prawem określonych także i ustawowy
                  obowiązek do przekazania wybranych bądź wszystkich informacji
                  dotyczących danych osobowych organom władzy publicznej bądź
                  osobom trzecim, które zgłoszą takie żądanie udzielenia
                  informacji na podstawie obowiązujących przepisów prawa
                  polskiego.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Użytkownik ma prawo do:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    dostępu do danych osobowych: Użytkownikowi przysługuje prawo
                    uzyskania dostępu do swoich danych osobowych, realizowane na
                    żądanie złożone do Administratora,
                  </li>
                  <li>
                    sprostowania danych osobowych: Użytkownikowi przysługuje
                    prawo żądania od Administratora niezwłocznego sprostowania
                    danych osobowych, które są nieprawidłowe lub / oraz
                    uzupełnienia niekompletnych danych osobowych, realizowane na
                    żądanie złożone do Administratora,
                  </li>
                  <li>
                    usunięcia danych osobowych: Użytkownikowi przysługuje prawo
                    żądania od Administratora niezwłocznego usunięcia danych
                    osobowych, realizowane na żądanie złożone do Administratora.
                    W przypadku kont użytkowników, usunięcie danych polega na
                    anonimizacji danych umożliwiających identyfikację
                    Użytkownika. Administrator zastrzega sobie prawo wstrzymania
                    realizacji żądania usunięcia danych w celu ochrony prawnie
                    uzasadnionego interesu Administratora (np. gdy Użytkownik
                    dopuścił się naruszenia Regulaminu czy dane zostały
                    pozyskane wskutek prowadzonej korespondencji). W przypadku
                    usługi Newsletter, Użytkownik ma możliwość samodzielnego
                    usunięcia swoich danych osobowych korzystając z odnośnika
                    umieszczonego w każdej przesyłanej wiadomości e-mail,
                  </li>
                  <li>
                    ograniczenia przetwarzania danych osobowych: Użytkownikowi
                    przysługuje prawo ograniczenia przetwarzania danych
                    osobowych w przypadkach wskazanych w art. 18 RODO, m.in.
                    kwestionowania prawidłowości danych osobowych, realizowane
                    na żądanie złożone do Administratora,
                  </li>
                  <li>
                    przenoszenia danych osobowych: Użytkownikowi przysługuje
                    prawo uzyskania od Administratora danych osobowych
                    dotyczących Użytkownika w ustrukturyzowanym, powszechnie
                    używanym formacie nadającym się do odczytu maszynowego,
                    realizowane na żądanie złożone do Administratora,
                  </li>
                  <li>
                    wniesienia sprzeciwu wobec przetwarzania danych osobowych:
                    Użytkownikowi przysługuje prawo wniesienia sprzeciwu wobec
                    przetwarzania jego danych osobowych w przypadkach
                    określonych w art. 21 RODO, realizowane na żądanie złożone
                    do Administratora,
                  </li>
                  <li>
                    wniesienia skargi: Użytkownikowi przysługuje prawo
                    wniesienia skargi do organu nadzorczego zajmującego się
                    ochroną danych osobowych.
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
