import Logo from "./Logo";

export default function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05060b] text-white">
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo
            className="h-24 w-auto"
            containerClassName="border-white/20 bg-white/5"
            disableLink={true}
          />
        </div>

        {/* Loading Text and Spinner */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-orange-400 border-t-orange-600 rounded-full animate-spin"></div>
            <span className="text-lg font-semibold text-orange-400">
              Ładowanie Paragonly...
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Przygotowujemy Twoje środowisko
          </p>
        </div>
      </div>
    </div>
  );
}
