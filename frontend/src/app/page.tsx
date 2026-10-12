import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import UspLine from "@/components/home/UspLine";
import { ProductSection } from "@/components/home/FeaturedProducts";
import OccasionTiles from "@/components/home/OccasionTiles";
import CorporateSplit from "@/components/home/CorporateSplit";
import SocialNewsletter from "@/components/SocialNewsletter";
import { getHeroSlide, getSettings, listProducts } from "@/lib/server-api";
import { uspsFromSettings } from "@/lib/product-helpers";
import type { ApiProduct } from "@/lib/api";

// Server-rendered on every request (R1: `next build` must not need the API). Each data-driven section
// catches its own failure and renders nothing; the hero and static sections never depend on the API (R13).
export const dynamic = "force-dynamic";

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

const SECTION_SIZE = 8;

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[home] ${label} failed; section skipped`, err);
    return fallback;
  }
}

export default async function Home() {
  const [hero, settings, featured, newest] = await Promise.all([
    getHeroSlide(),
    safe("settings", getSettings, {} as Record<string, string>),
    safe("featured products", async () => (await listProducts({ featured: true, take: SECTION_SIZE })).items, [] as ApiProduct[]),
    // Over-fetch so New arrivals can skip anything already shown under Featured.
    safe("new arrivals", async () => (await listProducts({ sort: "newest", take: SECTION_SIZE * 2 })).items, [] as ApiProduct[]),
  ]);

  const usingFeatured = featured.length > 0;
  const featuredItems = usingFeatured ? featured : newest.slice(0, SECTION_SIZE);
  const shown = new Set(featuredItems.map((p) => p.id));
  const arrivals = newest.filter((p) => !shown.has(p.id)).slice(0, SECTION_SIZE);

  return (
    <main>
      <Hero hero={hero} />
      <UspLine usps={uspsFromSettings(settings)} />
      <ProductSection
        eyebrow="The shop"
        title={usingFeatured ? "Our favourites" : "From the shop"}
        link={{ href: "/products", label: "View all" }}
        products={featuredItems}
      />
      <OccasionTiles />
      <CorporateSplit />
      <ProductSection
        eyebrow="New"
        title="Just in"
        link={{ href: "/products?sort=newest", label: "View all" }}
        products={arrivals}
      />
      {/* Phase 4 (Task 4.5): real, approved customer reviews go here once moderation exists. No testimonials until then. */}
      <SocialNewsletter />
    </main>
  );
}
