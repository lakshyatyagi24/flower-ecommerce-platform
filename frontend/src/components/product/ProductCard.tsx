import Image from "next/image";
import Link from "next/link";
import Price from "@/components/ui/Price";
import QuickAdd from "./QuickAdd";
import { productImage } from "@/lib/product-image";
import type { ApiProduct } from "@/lib/api";

// Hidden until hover/focus only on devices that can hover; always visible on touch.
const H = "[@media(hover:hover)]";
const REVEAL = `${H}:opacity-0 ${H}:group-hover:opacity-100 ${H}:group-focus-within:opacity-100`;

export default function ProductCard({ product, priority = false }: { product: ApiProduct; priority?: boolean }) {
  const href = `/products/${product.slug}`;
  const isEnquiry = product.saleMode === "ENQUIRY";
  const outOfStock = !isEnquiry && product.stock <= 0;

  return (
    <article className="group relative">
      <Link href={href} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-ivory-deep">
          <Image
            src={productImage(product)}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            priority={priority}
            className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.02]"
          />
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="font-sans text-sm font-normal leading-snug text-charcoal">{product.name}</h3>
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
