import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { ApiProduct } from "@/lib/api";
import { productImage } from "@/lib/product-image";

export type Crumb = { name: string; path: string };

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="py-6 text-xs text-stone-dark">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="h-3 w-px bg-stone-light" />}
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="text-charcoal">
                {c.name}
              </span>
            ) : (
              <Link href={c.path} className="hover:text-charcoal hover:underline underline-offset-4">
                {c.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ProductImage({ product }: { product: ApiProduct }) {
  return (
    <div className="md:sticky md:top-24 md:self-start">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-ivory-deep">
        <Image
          src={productImage(product)}
          alt={product.name}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
}
