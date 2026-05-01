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

export default function Home() {
  return (
    <main className="flex flex-col items-center pt-6 lg:pt-4">
      <Slider />
      <section className="section-shell mt-10 mb-6 text-center">
        <p className="pill mx-auto mb-3">Mandi-fresh every morning</p>
        <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight">
          Fresh-cut flowers, delivered the same day.
        </h1>
        <p className="mt-3 text-lg text-slate-700 max-w-3xl mx-auto">
          Roses, orchids, lilies, carnations, sunflowers and more — sourced directly from the mandi. Bulk pricing for corporates, custom bouquets and arrangements on enquiry.
        </p>
      </section>
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
