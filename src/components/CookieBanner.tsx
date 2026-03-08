import { useState } from "react";
import { Link } from "react-router-dom";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    const consent = localStorage.getItem("paragonly_cookie_consent");
    return !consent;
  });

  const handleAccept = () => {
    localStorage.setItem("paragonly_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("paragonly_cookie_consent", "rejected");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-700 text-gray-100 px-4 py-3 shadow-lg z-50">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-center sm:text-left">
          Ta strona używa plików cookie do zapewnienia działania aplikacji i
          poprawy jakości usług. Szczegóły znajdziesz w{" "}
          <Link
            to="/polityka-prywatnosci"
            className="text-orange-400 hover:text-orange-300 font-medium underline"
          >
            Polityce Prywatności
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer"
          >
            Akceptuję
          </button>
          <button
            onClick={handleReject}
            className="border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer"
          >
            Odrzuć
          </button>
        </div>
      </div>
    </div>
  );
}
