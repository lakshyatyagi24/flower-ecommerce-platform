import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/seo";
import { allFaqItems } from "./faq-data";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about delivery, payments, refunds, shipping and corporate orders from Fresh Petals India.",
  alternates: { canonical: "/faq" },
  openGraph: { title: "Frequently Asked Questions", description: "Answers about delivery, payments, refunds, shipping and corporate orders from Fresh Petals India.", url: "/faq", type: "website" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={faqJsonLd(allFaqItems)} />
      {children}
    </>
  );
}
