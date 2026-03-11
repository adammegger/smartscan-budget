import { Coffee } from "lucide-react";

export default function SuppiBadge() {
  return (
    <a
      href="https://suppi.pl/paragonly"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Wesprzyj projekt na Suppi"
    >
      <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 cursor-pointer">
        <div className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
          <Coffee size={20} className="group-hover:animate-pulse" />
        </div>
        <span className="hidden sm:inline-block font-semibold tracking-wide">
          Postaw mi kawę
        </span>
        <span className="sm:hidden font-semibold">Kawa</span>
      </div>
    </a>
  );
}
