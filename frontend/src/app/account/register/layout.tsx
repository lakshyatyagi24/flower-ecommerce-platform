import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Fresh Petals India account to track orders and check out faster.",
  alternates: { canonical: "/account/register" },
  openGraph: { title: "Create Account", description: "Create a Fresh Petals India account to track orders and check out faster.", url: "/account/register", type: "website" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
