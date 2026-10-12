import type { Metadata } from "next";
import Slider from "../components/Slider";
import QuickFinder from "../components/QuickFinder";
import BestInFlowers from "../components/BestInFlowers";
import NewArrivals from "../components/NewArrivals";
import SeasonalCollection from "../components/SeasonalCollection";
import CorporateCTA from "../components/CorporateCTA";
import EventInspirations from "../components/EventInspirations";
import TrustBar from "../components/TrustBar";
import Reviews from "../components/Reviews";
import SocialNewsletter from "@/components/SocialNewsletter";
import HomeHero from "../components/HomeHero";

export const metadata: Metadata = {
  title: { absolute: "Fresh Flowers & Bouquets Online in Delhi NCR" },
  description:
    "Order farm-fresh flowers, bouquets and plants online from Fresh Petals India. Mandi-fresh stems, careful packing and delivery across Delhi NCR.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Fresh Flowers & Bouquets Online in Delhi NCR",
    description:
      "Farm-fresh flowers, bouquets and plants sourced from the mandi every morning and delivered across Delhi NCR.",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="flex flex-col items-center pt-6 lg:pt-4">
      <Slider />
      <HomeHero />
      <QuickFinder />
      <BestInFlowers />
      <NewArrivals />
      <CorporateCTA />
      <SeasonalCollection />
      <EventInspirations />
      <Reviews />
      <TrustBar />
      <SocialNewsletter />
    </main>
  );
}
