import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PromoStrip from "@/components/PromoStrip";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { SettingsProvider } from "@/lib/settings-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

export const metadata: Metadata = {
  title: {
    default: "Fresh Petals India — Cut Flowers, Plants & Corporate Floral Solutions",
    template: "%s · Fresh Petals India",
  },
  description:
    "Farm-fresh cut flowers, indoor plants, and bulk corporate bouquets. Daily mandi-fresh stems, online ordering for cut flowers, custom enquiries for events.",
  keywords: [
    "cut flowers",
    "fresh flowers",
    "wholesale flowers",
    "corporate bouquets",
    "indoor plants",
    "floral arrangements",
    "Delhi flower supplier",
  ],
  openGraph: {
    title: "Fresh Petals India — Cut Flowers & Corporate Florals",
    description:
      "Farm-fresh cut flowers, indoor plants, and bulk corporate bouquets — sourced fresh from the mandi every morning.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fresh Petals India",
    description: "Farm-fresh cut flowers, plants & corporate floral solutions.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfairDisplay.variable} antialiased`}
      >
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              <PromoStrip />
              <Navbar />
              {children}
              <Footer />
              <CartDrawer />
              <WhatsAppButton />
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
