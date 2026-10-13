import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Fresh Petals India account to view orders and check out faster.",
  alternates: { canonical: "/account/login" },
  openGraph: { siteName: "Fresh Petals India", locale: "en_IN", title: "Sign In", description: "Sign in to your Fresh Petals India account to view orders and check out faster.", url: "/account/login", type: "website" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
