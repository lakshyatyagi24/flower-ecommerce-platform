'use client';
import { useState, useRef, useLayoutEffect, RefObject } from 'react';
import { mockProducts } from '@/modules/products/mockProducts';
import Link from 'next/link';
import Image from 'next/image';
import { useCartContext } from '@/modules/cart/components/CartProvider';
import clsx from 'clsx';
import { Product } from '@/modules/products/types';

// FILTER DATA
const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'New Arrivals', value: 'new' },
  { label: 'Seasonal Picks', value: 'seasonal' },
  { label: 'On Sale', value: 'on-sale' },
];

// For sorting best sellers
function sortProducts(products: Product[], activeFilter: string): Product[] {
  if (activeFilter === 'all') {
    return products
      .slice()
      .sort((a, b) => {
        const aBest = a.tags?.includes('best-seller') ? 1 : 0;
        const bBest = b.tags?.includes('best-seller') ? 1 : 0;
        const aArtisan = a.tags?.includes('artisan') ? 1 : 0;
        const bArtisan = b.tags?.includes('artisan') ? 1 : 0;
        if (bBest !== aBest) return bBest - aBest;
        if (bArtisan !== aArtisan) return bArtisan - aArtisan;
        return (b.salesCount ?? 0) - (a.salesCount ?? 0);
      });
  }
  return products;
}

// Animate filter indicator bar
function useMeasure(
  ref: RefObject<HTMLElement>,
  deps: unknown[]
): { width: number; left: number } {
  const [rect, setRect] = useState({ width: 0, left: 0 });
  // Combine deps into a stable string to avoid spread in dependency array
  const depsKey = JSON.stringify(deps);
  useLayoutEffect(() => {
    if (ref.current) {
      const { width, left } = ref.current.getBoundingClientRect();
      setRect({ width, left });
    }
  }, [ref, depsKey]);
  return rect;
}

export default function FeaturedProducts() {
  const [filter, setFilter] = useState('all');
  const [animKey, setAnimKey] = useState(0);
  const { addToCart } = useCartContext();
  const filterRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter and sort products
  const filtered = sortProducts(
    mockProducts.filter(product => filter === 'all' || product.tags?.includes(filter)),
    filter
  );
  const filteredProducts = filtered.slice(0, 12);

  // Dynamic indicator position
  const activeIdx = FILTERS.findIndex(f => f.value === filter);
  const activeBtnRef = filterRefs.current[activeIdx]!;
  const { width, left } = useMeasure({ current: activeBtnRef }, [filter, animKey]);
  const parentLeft = activeBtnRef && activeBtnRef.parentElement
  ? activeBtnRef.parentElement.getBoundingClientRect().left
  : 0;

  // Scroll arrows
  function scrollBy(delta: number) {
  if (containerRef.current) {
    containerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  }
}


  return (
    <section className="mt-16">
      <h2 className="font-serif text-3xl font-bold mb-7 text-brown-800 text-center">
        Featured Products
      </h2>

      {/* FILTERS */}
      <div className="relative flex flex-wrap gap-0 justify-center mb-12 transition-all duration-300">
        <div className="flex gap-2 bg-[#fcf6ed]/80 px-3 py-1 rounded-full shadow-sm border border-olive-200 relative">
          {FILTERS.map((f, i) => (
            <button
              ref={el => { filterRefs.current[i] = el; }}
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                setAnimKey(k => k + 1);
              }}
              className={clsx(
                'relative font-semibold rounded-full px-6 py-2 text-base outline-none focus:ring-2 focus:ring-accent z-10 transition-all duration-200',
                filter === f.value ? 'text-white' : 'text-brown',
                'hover:text-accent'
              )}
              style={{
                zIndex: filter === f.value ? 20 : 10,
                background: filter === f.value ? '#ec8112' : 'transparent',
                boxShadow: filter === f.value
                  ? '0 2px 18px 1px rgba(236,129,18,0.30)'
                  : undefined,
                transition: 'background 0.18s, color 0.18s, box-shadow 0.2s'
              }}
            >
              {f.label}
            </button>
          ))}
          {/* Animated indicator bar */}
          <span
            className="absolute rounded-full bg-accent shadow-lg transition-all duration-300"
            style={{
              height: 8,
              width: `${width}px`,
              left: `${left - parentLeft}px`,
              bottom: 4,
              zIndex: 2,
              opacity: width > 0 ? 0.9 : 0,
            }}
          />
        </div>
      </div>

      {/* Carousel with arrows on desktop */}
      <div className="relative">
        {/* Arrows for desktop */}
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-beige border border-olive-200 text-primary rounded-full shadow-md p-2 z-20 hidden lg:flex transition hover:bg-accent hover:text-white group"
          aria-label="Scroll left"
          onClick={() => scrollBy(-360)}
          type="button"
        >
          <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div
          ref={containerRef}
          className="flex gap-8 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory scrollbar-hide px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overscrollBehaviorX: 'none' }}
          tabIndex={0}
          onWheel={e => e.preventDefault()}
          onTouchMove={e => e.stopPropagation()}
        >
          {filteredProducts.length === 0 && (
            <div className="flex-1 text-center text-gray-400 py-8 w-full">
              No bouquets found for this filter.
            </div>
          )}
          {filteredProducts.map((product: Product) => (
            <div
              key={product.id}
              className={clsx(
                'min-w-[270px] max-w-[320px] flex-shrink-0 bg-white rounded-2xl shadow-md border border-olive-200 flex flex-col transition-transform duration-300 snap-center relative overflow-hidden group hover:-translate-y-2'
              )}
              tabIndex={0}
              style={{
                boxShadow:
                  product.tags?.includes('on-sale') && filter === 'on-sale'
                    ? '0 12px 32px 2px rgba(236,129,18,0.17)'
                    : undefined,
              }}
              aria-label={product.name + ' product card'}
            >
              {/* BADGES */}
              {product.tags?.includes('on-sale') && (
                <span
                  className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white text-accent border-2 border-accent shadow-lg font-semibold text-sm z-20"
                  style={{ filter: 'drop-shadow(0 4px 16px rgba(236,129,18,0.10))' }}
                  aria-label="On Sale"
                >
                  On Sale
                </span>
              )}
              {product.tags?.includes('new') && (
                <span
                  className="absolute top-3 left-3 px-3 py-1 rounded-full bg-green-700 text-white shadow font-medium text-sm z-20"
                  style={{ filter: 'drop-shadow(0 4px 8px #38613d4c)' }}
                  aria-label="New"
                >
                  New
                </span>
              )}
              {product.tags?.includes('artisan') && (
                <span
                  className="absolute top-12 left-3 px-3 py-1 rounded-full bg-brown-600 text-white shadow font-semibold text-sm z-20"
                  aria-label="Artisan Pick"
                  style={{ filter: 'drop-shadow(0 4px 8px #7c5c36a0)' }}
                >
                  Artisan Pick
                </span>
              )}
              {product.tags?.includes('eco') && (
                <span
                  className="absolute top-3 left-24 px-3 py-1 rounded-full bg-olive-600 text-white shadow font-semibold text-sm z-20"
                  aria-label="Eco-friendly"
                  style={{ filter: 'drop-shadow(0 4px 8px #3a5524a0)' }}
                >
                  Eco-friendly
                </span>
              )}
              {product.tags?.includes('seasonal') && (
                <span className="absolute top-1 left-1 px-2 py-0.5 rounded bg-accent text-white text-xs font-bold z-30 shadow" aria-label="Seasonal Pick">
                  Seasonal Pick
                </span>
              )}

              {/* PRODUCT IMAGE */}
              <div className="overflow-hidden h-56 rounded-t-2xl relative">
                <Image
                  src={product.image}
                  alt={product.name + ' bouquet'}
                  width={320}
                  height={224}
                  className="w-full h-56 object-cover scale-105 group-hover:scale-110 group-hover:brightness-95 transition-all duration-500"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#e7e0d9]/70 via-transparent to-transparent opacity-80 pointer-events-none" />
              </div>
              {/* PRODUCT INFO */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-serif text-lg font-bold text-primary mb-1">{product.name}</h3>
                <span className="text-green-700 text-base font-semibold mb-3">
                  ${product.price}
                </span>
                <div className="mt-auto flex flex-col gap-2">
                  <button
                    className="button-primary w-full text-sm shadow-sm hover:scale-105 transition-transform"
                    onClick={() => addToCart({ product, quantity: 1 })}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    Add to Cart
                  </button>
                  <Link
                    href={`/products/${product.id}`}
                    className="block w-full border border-accent text-accent font-semibold text-sm text-center rounded-md py-2 mt-0.5 hover:bg-accent hover:text-white transition-all"
                    aria-label={`View details of ${product.name}`}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Right arrow */}
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-beige border border-olive-200 text-primary rounded-full shadow-md p-2 z-20 hidden lg:flex transition hover:bg-accent hover:text-white group"
          aria-label="Scroll right"
          onClick={() => scrollBy(+360)}
          type="button"
        >
          <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
