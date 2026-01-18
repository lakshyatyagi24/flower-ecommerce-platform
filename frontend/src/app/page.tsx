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
        <p className="pill mx-auto mb-3">Inspired by Rebecca Purple</p>
        <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 leading-tight">Luxe florals for luminous evenings</h1>
        <p className="mt-3 text-lg text-slate-700 max-w-3xl mx-auto">A Magnolia Lane-inspired refresh with velvet ribbons, layered purples, and artisanal packaging. Same-day delivery across Mumbai & NCR.</p>
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
