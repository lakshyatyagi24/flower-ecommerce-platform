import ProductCard from "./ProductCard";
import type { ApiProduct } from "@/lib/api";

export default function ProductGrid({ products, priorityCount = 0 }: { products: ApiProduct[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-14 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
