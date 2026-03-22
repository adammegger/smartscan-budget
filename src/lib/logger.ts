const isDev =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.DEV) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "development");

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: any[]) => {
    // Błędy zazwyczaj chcemy widzieć nawet na produkcji, lub wysyłać do narzędzi typu Sentry
    console.error(...args);
  },
  // Funkcja do logów czysto debugowych, które można łatwo zlokalizować i usunąć
  debug: (...args: any[]) => {
    if (isDev) console.log("[DEBUG]", ...args);
  },
};
