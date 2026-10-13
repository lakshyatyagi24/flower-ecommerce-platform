import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PromoStrip from "@/components/PromoStrip";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawerLazy";
import WhatsAppButton from "@/components/WhatsAppButton";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { SettingsProvider } from "@/lib/settings-context";
import JsonLd from "@/components/JsonLd";
import { getLayoutSettings } from "@/lib/server-api";
import { SITE, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  // 400 body/headings, 500 wordmark + h3. No 600 or italic is used anywhere (each unused face is a blocking-ish font file).
  weight: ["400", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

// Statically prerendered pages are rebuilt at most every 5 minutes, so settings that were unreachable at build
// time (no API in the Docker build) are picked up on the first request after that instead of never.
export const revalidate = 300;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Fresh Petals India — Cut Flowers & Corporate Floral Solutions",
    template: "%s · Fresh Petals India",
  },
  description:
    "Fresh cut flowers online, plus custom floral enquiries for corporate clients and events. Order online and have them delivered across Delhi NCR.",
  keywords: [
    "cut flowers",
    "fresh flowers",
    "wholesale flowers",
    "corporate flowers",
    "floral arrangements",
    "Delhi flower supplier",
  ],
  openGraph: {
    title: "Fresh Petals India — Cut Flowers & Corporate Florals",
    description:
      "Fresh cut flowers online, plus custom floral enquiries for corporate clients and events.",
    type: "website",
    siteName: "Fresh Petals India",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fresh Petals India",
    description: "Fresh cut flowers and corporate floral solutions.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialSettings = await getLayoutSettings();
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="antialiased">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <SettingsProvider initialRaw={initialSettings}>
          <AuthProvider>
            <CartProvider>
              <a href="#main" className="skip-link">
                Skip to main content
              </a>
              <PromoStrip />
              <Navbar />
              <div id="main" tabIndex={-1} className="outline-none">
                {children}
              </div>
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
