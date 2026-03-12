/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        scan: {
          "0%, 100%": { transform: "translateY(-10%)" },
          "50%": { transform: "translateY(110%)" },
        },
        "scan-laser": {
          "0%, 100%": { top: "0%", opacity: "0.8" },
          "50%": { top: "calc(100% - 3px)", opacity: "1" },
        },
      },
      animation: {
        scan: "scan 2s ease-in-out infinite",
        "scan-laser": "scan-laser 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".scrollbar-hide": {
          /* IE and Edge */
          "-ms-overflow-style": "none",
          /* Firefox */
          "scrollbar-width": "none",
          /* Safari and Chrome */
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
