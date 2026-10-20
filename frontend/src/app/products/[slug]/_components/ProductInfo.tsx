import React from "react";
import Eyebrow from "@/components/ui/Eyebrow";
import Price from "@/components/ui/Price";
import ProductBuyBox from "@/components/product/ProductBuyBox";
import Stars from "@/components/product/Stars";
import type { ApiProduct } from "@/lib/api";
import { splitDescription } from "@/lib/description";
import type { Usp } from "@/lib/product-helpers";
import ProductAccordions from "./ProductAccordions";

const plural = (n: number) => (n === 1 ? "" : "s");

function PriceLine({ product }: { product: ApiProduct }) {
  if (product.saleMode === "ENQUIRY") return <span className="text-xl text-charcoal">Price on enquiry</span>;
  const unit = product.unit && product.unit !== "piece" ? `/ ${product.unit}` : undefined;
  return (
    <>
      <Price amount={product.price} unit={unit} className="text-2xl" />
      <span className="text-xs text-stone-dark">
        {product.gstRate && product.gstRate > 0 ? `+ ${product.gstRate}% GST` : "No GST"}
      </span>
    </>
  );
}

function RatingLink({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  if (reviewCount <= 0) return null;
  return (
    <a
      href="#reviews"
      className="mt-4 inline-flex items-center gap-2 text-sm text-stone-dark hover:text-charcoal"
      aria-label={`Rated ${rating.toFixed(1)} out of 5 from ${reviewCount} review${plural(reviewCount)}`}
    >
      <Stars value={rating} />
      <span>
        {rating.toFixed(1)} · {reviewCount} review{plural(reviewCount)}
      </span>
    </a>
  );
}

function UspList({ usps }: { usps: Usp[] }) {
  return (
    <ul className="mt-8 divide-y divide-stone-light border-y border-stone-light text-sm">
      {usps.map((u) => (
        <li key={u.title} className="py-4">
          <span className="text-charcoal">{u.title}</span>
          {u.body && <span className="text-stone-dark"> — {u.body}</span>}
        </li>
      ))}
    </ul>
  );
}

type ProductInfoProps = { product: ApiProduct; usps: Usp[]; settings: Record<string, string> };

/** The right-hand column of the product page: title, price, rating, buy box, selling points and accordions. */
export default function ProductInfo({ product, usps, settings }: ProductInfoProps) {
  const { lead, rest } = splitDescription(product.description);
  const minOrderQty = product.minOrderQty && product.minOrderQty > 0 ? product.minOrderQty : 1;
  return (
    <div className="md:py-4">
      {product.category && <Eyebrow className="mb-4">{product.category.name}</Eyebrow>}
      <h1 className="type-h1 text-charcoal">{product.name}</h1>
      <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <PriceLine product={product} />
      </div>
      <RatingLink rating={product.averageRating ?? 0} reviewCount={product.reviewCount ?? 0} />
      {lead && <p className="mt-6 text-base leading-relaxed text-stone-dark">{lead}</p>}
      <div className="mt-8 border-t border-stone-light pt-8">
        <ProductBuyBox product={product} />
      </div>
      <UspList usps={usps} />
      <ProductAccordions
        product={product}
        rest={rest}
        minOrderQty={minOrderQty}
        deliverySummary={settings["policies.deliverySummary"]?.trim()}
        returnsSummary={settings["policies.returnsSummary"]?.trim()}
      />
    </div>
  );
}
