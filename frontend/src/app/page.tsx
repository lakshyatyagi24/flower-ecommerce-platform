import Slider from "../components/Slider";
import QuickFinder from "../components/QuickFinder";
import BestInFlowers from "../components/BestInFlowers";
import NewArrivals from "../components/NewArrivals";
import SeasonalCollection from "../components/SeasonalCollection";
import EventInspirations from "../components/EventInspirations";
import BuildYourBouquet from "../components/BuildYourBouquet";
import TrustBar from "../components/TrustBar";
import Reviews from "../components/Reviews";
import SocialNewsletter from "@/components/SocialNewsletter";

export default function Home() {
  return (
    <main className="flex flex-col items-center pt-6 lg:pt-4">
      <Slider />
      <section className="section-shell mt-10 mb-6 text-center">
        <p className="pill mx-auto mb-3">Farm fresh, delivered fast</p>
        <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight">Fresh flowers for every occasion</h1>
        <p className="mt-3 text-lg text-slate-700 max-w-3xl mx-auto">Premium cut flowers sourced directly from farms — roses, orchids, sunflowers, lilies and more. Same-day delivery across major Indian cities.</p>
      </section>
      <QuickFinder />
      <BestInFlowers />
  <NewArrivals />
  <SeasonalCollection />
  <EventInspirations />
  <BuildYourBouquet />
  <Reviews />
  <TrustBar />
  <SocialNewsletter />
    </main>
  );
}
