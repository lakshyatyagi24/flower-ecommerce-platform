import React from "react";
import Link from "next/link";
import Accordion from "@/components/product/Accordion";
import type { ApiProduct } from "@/lib/api";
import type { DescriptionBlock } from "@/lib/description";
import { careCopy } from "@/lib/product-helpers";

function DescriptionBlocks({ blocks }: { blocks: DescriptionBlock[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.heading ? (
          <p key={i} className="pt-2 text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal">
            {b.text}
          </p>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
    </>
  );
}

function ProductFacts({ product, minOrderQty }: { product: ApiProduct; minOrderQty: number }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
      {product.category && (
        <>
          <dt>Category</dt>
          <dd className="text-charcoal">{product.category.name}</dd>
        </>
      )}
      <dt>Sold by</dt>
      <dd className="text-charcoal">{product.unit || "piece"}</dd>
      {minOrderQty > 1 && (
        <>
          <dt>Minimum order</dt>
          <dd className="text-charcoal">{minOrderQty}</dd>
        </>
      )}
    </dl>
  );
}

type AccordionsProps = {
  product: ApiProduct;
  rest: DescriptionBlock[];
  minOrderQty: number;
  deliverySummary: string | undefined;
  returnsSummary: string | undefined;
};

export default function ProductAccordions({ product, rest, minOrderQty, deliverySummary, returnsSummary }: AccordionsProps) {
  return (
    <div className="mt-2">
      <Accordion title="Details" open>
        <DescriptionBlocks blocks={rest} />
        <ProductFacts product={product} minOrderQty={minOrderQty} />
      </Accordion>
      <Accordion title="Care">
        {careCopy(product.productType).map((t) => (
          <p key={t}>{t}</p>
        ))}
      </Accordion>
      <Accordion title="Delivery & returns">
        {deliverySummary && <p>{deliverySummary}</p>}
        {returnsSummary && <p>{returnsSummary}</p>}
        <p>
          Flowers are perishable.{" "}
          <Link href="/refund-policy" className="text-charcoal underline underline-offset-4">
            Read our refund policy
          </Link>{" "}
          for what to do if your order arrives damaged.
        </p>
      </Accordion>
    </div>
  );
}
