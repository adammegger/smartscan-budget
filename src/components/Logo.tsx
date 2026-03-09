import { Link } from "react-router-dom";
import logoLight from "@assets/logoLight.png";
import logoDark from "@assets/logoDark.png";

interface LogoProps {
  className?: string; // Pozwoli na customizację szerokości/wysokości w różnych miejscach
  containerClassName?: string; // Opcjonalne klasy do samego modyfikowania ramki
  onClick?: () => void;
  disableLink?: boolean; // Nowa opcjonalna właściwość do wyłączenia linku
}

export default function Logo({
  className = "h-8 w-auto",
  containerClassName = "",
  onClick,
  disableLink = false,
}: LogoProps) {
  const logoContent = (
    <div
      className={`
        flex items-center justify-center
        border p-1.5 rounded-xl
        border-border/60 bg-background/50 backdrop-blur-sm shadow-sm
        dark:border-white/10 dark:bg-black/20
        group-hover:border-primary/40 transition-all duration-300
        ${containerClassName}
      `}
    >
      <img
        src={logoLight}
        alt="Paragonly Logo"
        className={`dark:hidden object-contain ${className}`}
      />
      <img
        src={logoDark}
        alt="Paragonly Logo"
        className={`hidden dark:block object-contain ${className}`}
      />
    </div>
  );

  if (disableLink) {
    return (
      <div
        onClick={onClick}
        className="w-fit inline-flex items-center gap-2 select-none group cursor-pointer"
      >
        {logoContent}
      </div>
    );
  }

  return (
    <Link
      to="/"
      onClick={onClick}
      className="w-fit inline-flex items-center gap-2 select-none group cursor-pointer"
    >
      {logoContent}
    </Link>
  );
}
