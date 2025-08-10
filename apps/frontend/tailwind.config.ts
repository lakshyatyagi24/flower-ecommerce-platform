import type { Config } from "tailwindcss";
import tailwindScrollbarHide from "tailwind-scrollbar-hide";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ['"Geist Sans"', "Arial", "sans-serif"],
      },
      colors: {
        beige: "#fcfaf7",
        olive: "#b9a179",
        "olive-200": "#e6dfc8",
        brown: "#9a6a3a",
        "brown-800": "#55341d",
        "olive-dark": "#9a7d42",
        green: "#4e7039",
        "green-700": "#38613d",
        accent: "#ec8112",
        primary: "#1C140D",
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(2rem)' },
          '60%': { opacity: '0.7', transform: 'translateY(0.25rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) both',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(236,129,18,0.13)',
        'md': '0 8px 32px -8px rgba(75,63,42,0.22)',
        'lg': '0 12px 40px -10px rgba(75,63,42,0.3)',
      }
    },
  },
  plugins: [
      tailwindScrollbarHide,
  ],
};

export default config;
