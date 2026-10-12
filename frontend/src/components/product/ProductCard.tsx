import Image from "next/image";
import Link from "next/link";
import Price from "@/components/ui/Price";
import QuickAdd from "./QuickAdd";
import { PLACEHOLDER_IMAGE, productImage } from "@/lib/product-image";
import { availability } from "@/lib/product-helpers";
import type { ApiProduct } from "@/lib/api";

// Hidden until hover/focus only on devices that can hover; always visible on touch.
// (Literal class names so Tailwind can detect them.)
const REVEAL =
  "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100";

// Photo-less products get a quiet "tile art" instead of 95 identical blank squares: a tone picked by product id
// from the palette, with the product name set in the display serif. Real photos replace it automatically.
const TONES = ["bg-ivory-deep", "bg-blush/25", "bg-moss/15", "bg-stone-light/50"];

type Props = { product: ApiProduct; priority?: boolean; headingLevel?: 2 | 3 };

export default function ProductCard({ product, priority = false, headingLevel = 2 }: Props) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const href = `/products/${product.slug}`;
  const src = productImage(product);
  const status = availability(product);
  const isEnquiry = status === "enquiry";
  const outOfStock = status === "out-of-stock";

  return (
    <article className="group relative">
      <Link href={href} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss">
        {src === PLACEHOLDER_IMAGE ? (
          <div
            className={`relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-sm p-5 text-center ${TONES[product.id % TONES.length]}`}
          >
            <span aria-hidden className="pointer-events-none absolute inset-3 border border-stone-light/70" />
            <span aria-hidden className="relative font-display text-base leading-tight text-charcoal/80 sm:text-xl md:text-2xl">
              {product.name}
            </span>
          </div>
        ) : (
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-ivory-deep">
            <Image
              src={src}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              priority={priority}
              className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
            />
          </div>
        )}
        <div className="mt-3 space-y-1">
          <Heading className="font-sans! text-sm font-normal leading-snug text-charcoal">{product.name}</Heading>
          <p className="flex flex-wrap items-baseline gap-x-3 text-sm">
            {isEnquiry ? <span className="text-stone-dark">On enquiry</span> : <Price amount={product.price} />}
            {outOfStock && <span className="text-xs uppercase tracking-[0.12em] text-stone-dark">Out of stock</span>}
          </p>
        </div>
      </Link>
      {!outOfStock && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex aspect-[4/5] items-end justify-center">
          <div className={`pointer-events-auto mb-3 transition-opacity ${REVEAL}`}>
            {isEnquiry ? (
              <Link
                href={href}
                aria-label={`Enquire about ${product.name}`}
                className="flex min-h-[44px] items-center bg-ivory/95 px-4 text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal underline underline-offset-4 decoration-stone hover:decoration-charcoal focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moss"
              >
                Enquire
              </Link>
            ) : (
              <QuickAdd product={product} />
            )}
          </div>
        </div>
      )}
    </article>
  );
}
