import type { Config } from "tailwindcss";
import tailwindScrollbarHide from "tailwind-scrollbar-hide";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  extend: {
    colors: {
      olive: {
        900: '#3A3F2D',
        700: '#6C7559',
      },
      neutral: {
        100: '#F6F6F2',
        700: '#6E7266',
        900: '#22221B',
      },
      // Custom brand colors
      beige: {
        100: '#F7F1E6',
        300: '#E6DFC8',
      },
      brown: '#4B3F2A',
      accent: '#EC8112',
      'success-green': '#2E7D32',
    },
    boxShadow: {
      'elev-1': '0 8px 24px -10px rgba(75, 63, 42, 0.16)',
      'elev-2': '0 14px 36px -12px rgba(75, 63, 42, 0.22)',
    },
    fontFamily: {
      serif: ["'Playfair Display'", 'serif'],
      sans: ["'Geist Sans'", 'Arial', 'sans-serif'],
    },
    // Soft fade-in
    keyframes: {
      'fade-in-up': {
        '0%': { opacity: '0', transform: 'translateY(24px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
    },
    animation: {
      'fade-in-up': 'fade-in-up 1s cubic-bezier(0.4, 0, 0.2, 1) both',
      'fade-in': 'fade-in 1.5s ease-in',
    },
  },
}
,
  plugins: [
      tailwindScrollbarHide,
  ],
};

export default config;
