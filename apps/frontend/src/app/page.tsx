import FeaturedProducts from '@/components/FeaturedProducts';
import WhyChooseUs from '@/components/WhyChooseUs';
import GallerySection from '@/components/GallerySection';
import TestimonialsSection from '@/components/TestimonialsSection';
import Hero from '@/components/Hero';
import QuickEventPrompt from '@/components/QuickEventPrompt';
import NewsletterSignup from '@/components/NewsletterSignup';
import SocialIcons from '@/components/SocialIcons';
import ShopByCategory from '@/components/ShopByCategory';
import AboutUsPreview from '@/components/AboutUsPreview';
import InfoMarquee from '@/components/InfoMarquee';
import TrustBadges from '@/components/TrustBadges';

export default function Home() {
  return (
    <main>
      <div className="mb-10">
        <Hero />
      </div>
      <div className="max-w-6xl mx-auto py-10 px-4">
        <FeaturedProducts />
        <WhyChooseUs />
        <GallerySection />
        <TestimonialsSection />
        <QuickEventPrompt />
        <NewsletterSignup />
        <SocialIcons />
        <ShopByCategory />
        <AboutUsPreview />
        <InfoMarquee />
        <TrustBadges />
      </div>
    </main>
  );
}
