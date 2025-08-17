import Slider from "../components/Slider";
import QuickFinder from "../components/QuickFinder";
import BestInFlowers from "../components/BestInFlowers";
import NewArrivals from "../components/NewArrivals";
import SeasonalCollection from "../components/SeasonalCollection";
import EventInspirations from "../components/EventInspirations";
import BuildYourBouquet from "../components/BuildYourBouquet";
import { TrustBarCompact } from "../components/TrustBar";
import Reviews from "../components/Reviews";

export default function Home() {
  return (
    <main className="flex flex-col items-center pt-6 lg:pt-4">
      <Slider />
      <QuickFinder />
      <BestInFlowers />
  <NewArrivals />
  <SeasonalCollection />
  <EventInspirations />
  <BuildYourBouquet />
  <Reviews />
    </main>
  );
}
