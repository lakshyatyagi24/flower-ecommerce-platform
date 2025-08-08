import type { Config } from "tailwindcss";
import tailwindScrollbarHide from "tailwind-scrollbar-hide";

const config: Config = {
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
    },
  },
  plugins: [
      tailwindScrollbarHide,
  ],
};

export default config;
