import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import pic1 from "assets/pic1.png";

export default function UnderConstruction() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <Logo className="h-20 w-auto mx-auto" disableLink />
        </div>

        {/* Main Heading */}
        <h1
          className="text-4xl font-bold text-white mb-4 tracking-tight"
          style={{
            fontFamily:
              "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif",
            fontSize: "2.25rem",
            fontWeight: "700",
          }}
        >
          PARAGONLY
        </h1>

        {/* Image */}
        <div className="relative mb-8 mt-8">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-3xl blur-3xl -z-10"></div>

          <img
            src={pic1}
            alt="Skanowanie paragonów i analiza wydatków w Paragonly"
            className="w-full max-w-2xl mx-auto border border-orange-500/20 rounded-3xl shadow-[0_0_40px_rgba(249,115,22,0.15)] hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(249,115,22,0.25)] transition-all duration-500 ease-out"
            loading="lazy"
          />
        </div>

        {/* Main Text */}
        <p className="text-gray-300 text-lg leading-relaxed mb-8">
          Pracujemy nad inteligentnym asystentem do skanowania paragonów i
          kontroli wydatków. Zajrzyj tu niedługo ponownie.
        </p>

        {/* Preview Info */}
        {/* <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-8">
          <p className="text-gray-400 text-sm mb-2">
            Dla zaproszonych testerów:
          </p>
          <code className="bg-gray-900 px-3 py-1 rounded text-orange-400 font-mono text-sm">
            ?preview=paragonly-preview-2026
          </code>
        </div> */}

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 font-semibold text-sm mb-6">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          W budowie
        </div>

        {/* Back to Home */}
        <div className="flex gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg"
          >
            Dziękujemy za cierpliwość!
          </Link>
        </div>

        {/* Footer */}
        {/* <div className="mt-12 text-gray-500 text-sm">
          Dziękujemy za cierpliwość!
        </div> */}
      </div>
    </div>
  );
}
