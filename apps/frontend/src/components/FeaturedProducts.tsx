'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Product } from '@/modules/products/types';
import { mockProducts } from '@/modules/products/mockProducts';
import { ProductCard } from '@/components/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

// UTILITY FUNCTIONS
const getUniqueTags = (products: Product[]): string[] => {
  const allTags = products.flatMap(p => p.tags || []);
  const displayTags = ['new', 'seasonal', 'on-sale', 'eco', 'artisan']; // Define which tags should be filters
  const uniqueDisplayTags = [...new Set(allTags.filter(tag => displayTags.includes(tag)))];
  return ['all', ...uniqueDisplayTags];
};

const formatTabLabel = (tag: string): string => {
  const labels: { [key: string]: string } = {
    all: 'All',
    new: 'New Arrivals',
    seasonal: 'Seasonal Picks',
    'on-sale': 'On Sale',
    eco: 'Eco-Friendly',
    artisan: 'Artisan',
  };
  return labels[tag] || tag;
};

// SKELETON LOADER
const SkeletonCard = () => (
  <li className="flex flex-col w-full animate-pulse">
    <div className="aspect-[4/3] w-full rounded-t-xl bg-beige-300"></div>
    <div className="p-5">
      <div className="h-4 w-3/4 rounded bg-beige-300"></div>
      <div className="mt-2 h-6 w-1/2 rounded bg-beige-300"></div>
      <div className="mt-4 space-y-2">
        <div className="h-11 w-full rounded-md bg-beige-300"></div>
        <div className="h-11 w-full rounded-md bg-beige-300"></div>
      </div>
    </div>
  </li>
);

// MAIN COMPONENT
export default function FeaturedProducts() {
  const [filter, setFilter] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLUListElement>(null);

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Memoize filters so they are not recalculated on every render
  const availableFilters = useMemo(() => getUniqueTags(mockProducts), []);

  useEffect(() => {
    const activeTabIndex = availableFilters.findIndex(f => f === filter);
    const activeTab = tabRefs.current[activeTabIndex];
    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [filter, availableFilters]);

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    const timer = setTimeout(() => {
      const filtered = mockProducts.filter(p => filter === 'all' || p.tags?.includes(filter));
      setProducts(filtered);
      setIsLoading(false);
    }, 300); // Simulate network delay
    return () => clearTimeout(timer);
  }, [filter]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const isAtStart = el.scrollLeft < 5;
      const isAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 5;
      setShowLeftArrow(!isAtStart);
      setShowRightArrow(!isAtEnd);
    }
  }, []);

  const scrollBy = (amount: number) => {
    scrollContainerRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => el.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, products]); // Re-run when products change, as scroll width might change

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % availableFilters.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + availableFilters.length) % availableFilters.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = availableFilters.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    tabRefs.current[nextIndex]?.click();
  };

  return (
    <section id="featured-products" aria-labelledby="featured-products-heading" className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 id="featured-products-heading" className="font-serif text-brown [font-size:clamp(2rem,4vw,3rem)] tracking-tight">
            Featured Products
          </h2>
          <p className="sr-only">Discover our hand-picked selection of bouquets and arrangements.</p>
        </div>

        <div role="tablist" aria-label="Product categories" className="flex justify-center mb-12">
          <div className="relative flex items-center space-x-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory p-1 bg-beige-100/50 rounded-full">
            <div
              className="absolute h-10 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out"
              style={indicatorStyle}
            />
            {availableFilters.map((tag, index) => (
              <button
                key={tag}
                id={`tab-${tag}`}
                role="tab"
                ref={el => tabRefs.current[index] = el}
                aria-selected={filter === tag}
                aria-controls="product-panel"
                onClick={() => setFilter(tag)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                tabIndex={filter === tag ? 0 : -1}
                className={clsx(
                  'relative z-10 whitespace-nowrap rounded-full border border-transparent px-4 py-2 text-sm font-semibold transition-colors duration-300 outline-none snap-center sm:px-5 sm:text-base',
                  'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-3',
                  filter === tag
                    ? 'text-brown'
                    : 'text-brown hover:text-accent',
                )}
              >
                {formatTabLabel(tag)}
              </button>
            ))}
          </div>
        </div>

        <div id="product-panel" role="tabpanel" className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-white via-white/80 to-transparent md:hidden" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-white via-white/80 to-transparent md:hidden" />

          <div className="absolute inset-y-0 left-0 z-10 hidden items-center md:flex">
            <button
              onClick={() => scrollBy(-400)}
              aria-label="Scroll left"
              disabled={!showLeftArrow}
              className="group rounded-full bg-white/60 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white/80 disabled:scale-50 disabled:opacity-0"
            >
              <ChevronLeft className="h-6 w-6 text-brown transition-transform group-hover:-translate-x-1" />
            </button>
          </div>

          <ul
            ref={scrollContainerRef}
            aria-live="polite"
            className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 md:flex md:overflow-x-auto md:pb-8 md:snap-x md:snap-mandatory scrollbar-hide"
          >
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : products.length > 0 ? (
              products.map(product => <ProductCard key={product.id} product={product} />)
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center text-center py-16 w-full">
                <h3 className="font-serif text-2xl text-brown">No Products Found</h3>
                <p className="text-neutral-700 mt-2">Try a different category or view all our products.</p>
                <Link href="/shop" className="mt-4 inline-block rounded-md bg-accent px-6 py-3 font-semibold text-brown hover:brightness-105">
                  Shop All Products
                </Link>
              </div>
            )}
          </ul>

          <div className="absolute inset-y-0 right-0 z-10 hidden items-center md:flex">
            <button
              onClick={() => scrollBy(400)}
              aria-label="Scroll right"
              disabled={!showRightArrow}
              className="group rounded-full bg-white/60 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white/80 disabled:scale-50 disabled:opacity-0"
            >
              <ChevronRight className="h-6 w-6 text-brown transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
