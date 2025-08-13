import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { Product } from '@/modules/products/types';
import { useCartContext } from '@/modules/cart/components/CartProvider';

// A simple utility to format price from cents to dollars
const formatPrice = (priceInCents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceInCents / 100);
};

// Placeholder for the Wishlist icon
const WishlistButton = () => {
    return (
        <button
            aria-label="Add to wishlist"
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            onClick={() => console.log('Wishlist clicked (placeholder)')}
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.68998C2 5.59998 4.49 3.10999 7.56 3.10999C9.38 3.10999 10.99 3.97999 12 5.31999C13.01 3.97999 14.62 3.10999 16.44 3.10999C19.51 3.10999 22 5.59998 22 8.68998C22 15.69 15.52 19.82 12.62 20.81Z" stroke="#4B3F2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </button>
    );
};

const Badge = ({ children, className, ...props }: { children: React.ReactNode; className?: string; 'aria-label'?: string }) => (
  <div className={`text-xs font-semibold px-3 py-1 rounded-full shadow ${className}`} {...props}>
    {children}
  </div>
);

const ProductBadges = ({ tags }: { tags: Product['tags'] }) => {
  if (!tags || tags.length === 0) return null;

  const badgeMap: { [key: string]: { label: string; className: string; ariaLabel: string } } = {
    new: { label: 'New', className: 'bg-white text-brown', ariaLabel: 'New product' },
    'on-sale': { label: 'On Sale', className: 'bg-accent text-white', ariaLabel: 'This product is on sale' },
    seasonal: { label: 'Seasonal', className: 'bg-success-green text-white', ariaLabel: 'Seasonal product' },
    eco: { label: 'Eco-Friendly', className: 'bg-olive-700 text-white', ariaLabel: 'This is an eco-friendly product' },
  };

  const relevantBadges = (tags || [])
    .map(tag => badgeMap[tag])
    .filter(Boolean);

  if (relevantBadges.length === 0) return null;

  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
      {relevantBadges.map(badge => (
        <Badge key={badge.label} className={badge.className} aria-label={badge.ariaLabel}>
          {badge.label}
        </Badge>
      ))}
    </div>
  );
};

export const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCartContext();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart({ product, quantity: 1 });
    setTimeout(() => setIsAdding(false), 1500); // Simulate network/animation time
  };

  return (
    <li
      className="group relative flex flex-col rounded-xl border border-beige-300 bg-white shadow-elev-1 transition-all duration-300 hover:shadow-elev-2 motion-safe:hover:-translate-y-1"
    >
      <div className="relative overflow-hidden rounded-t-xl">
        <ProductBadges tags={product.tags} />
        <WishlistButton />

        <Link href={`/products/${product.id}`} aria-label={`View details for ${product.name}`}>
          <Image
            src={product.image}
            alt={product.name}
            width={400}
            height={300}
            className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg=="
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-serif leading-tight text-brown [font-size:clamp(1rem,1.8vw,1.25rem)]">
          <Link href={`/products/${product.id}`} className="line-clamp-2 hover:text-accent transition-colors">
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-bold text-success-green" aria-label={`Price: ${formatPrice(product.price)}`}>
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-neutral-700 line-through" aria-label={`Original price: ${formatPrice(product.originalPrice)}`}>
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 space-y-2">
           <button
            onClick={handleAddToCart}
            disabled={isAdding}
            aria-busy={isAdding}
            className="flex h-11 min-h-[44px] w-full items-center justify-center rounded-md bg-accent px-4 py-2 font-semibold text-brown transition-transform active:scale-[0.98] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            aria-label={`Add ${product.name} to cart`}
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
          <Link
            href={`/products/${product.id}`}
            className="flex h-11 min-h-[44px] w-full items-center justify-center rounded-md border border-beige-300 bg-transparent px-4 py-2 font-semibold text-brown transition-colors hover:bg-beige-100"
            aria-label={`View details for ${product.name}`}
          >
            View Details
          </Link>
        </div>
      </div>
    </li>
  );
};
