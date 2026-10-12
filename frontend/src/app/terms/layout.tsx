import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that apply when you order flowers, plants and gifts from Fresh Petals India.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms & Conditions", description: "The terms that apply when you order flowers, plants and gifts from Fresh Petals India.", url: "/terms", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
