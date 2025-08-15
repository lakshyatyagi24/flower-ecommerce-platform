import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-beige': '#F5F5DC',
        'brand-olive': '#556B2F',
        'brand-brown': '#8B4513',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['var(--font-geist-sans)'],
      },
    },
  },
  plugins: [],
}
export default config
