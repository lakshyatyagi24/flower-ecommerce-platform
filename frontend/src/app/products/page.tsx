import Image from "next/image";
import Link from "next/link";
import { api, formatINR, sanitizeImageUrl } from "@/lib/api";

const FALLBACK_IMG =
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5577.jpg?v=1709440942";

function firstValue(input: string | string[] | undefined): string | undefined {
  if (typeof input === "string") return input;
  if (Array.isArray(input) && input.length > 0) return input[0];
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function ProductsPage(props: any) {
  const rawSearchParams = props?.searchParams as
    | Record<string, string | string[] | undefined>
    | undefined;

  const category = firstValue(rawSearchParams?.category)?.trim();
  const q = firstValue(rawSearchParams?.q)?.trim();

  const [productsResult, categories] = await Promise.all([
    api.listProducts({
      active: true,
      category: category || undefined,
      q: q || undefined,
      take: 60,
    }),
    api.listCategories().catch(() => []),
  ]);

  const products = productsResult.items;
  const selectedCategory = categories.find((c) => c.slug === category);

  return (
    <main className="section-shell mt-12 mb-16">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="pill mb-3">Live catalog</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">
            {selectedCategory?.name ?? "All Flowers"}
          </h1>
          <p className="text-slate-700 mt-2">
            {q
              ? `Showing matches for "${q}" from the latest synced inventory.`
              : "Browse real-time floral inventory with current prices and stock."}
          </p>
        </div>
        <Link
          href="/"
          className="text-olive-green font-semibold underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/products"
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              !category
                ? "bg-olive-green text-white border-olive-green"
                : "bg-white border-olive-green/20 text-slate-700 hover:border-olive-green/50"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${encodeURIComponent(c.slug)}`}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                category === c.slug
                  ? "bg-olive-green text-white border-olive-green"
                  : "bg-white border-olive-green/20 text-slate-700 hover:border-olive-green/50"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="section-card p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900">No products found</h2>
          <p className="mt-2 text-slate-600">
            Try removing filters or searching with a broader keyword.
          </p>
          <Link
            href="/products"
            className="inline-flex mt-4 rounded-full bg-olive-green text-white px-5 py-2 text-sm font-semibold"
          >
            View all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <article
              key={p.id}
              className="section-card overflow-hidden group border border-olive-green/10"
            >
              <Link href={`/products/${p.slug}`} className="relative block w-full h-48 sm:h-56">
                <Image
                  src={sanitizeImageUrl(p.image) ?? FALLBACK_IMG}
                  alt={p.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </Link>
              <div className="p-4 flex flex-col gap-2">
                <span className="text-[12px] uppercase tracking-[0.14em] text-olive-green/70">
                  {p.category?.name ?? "Cut Flowers"}
                </span>
                <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">{p.name}</h3>
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span className="font-semibold text-olive-green">{formatINR(p.price)}</span>
                  <Link href={`/products/${p.slug}`} className="text-olive-green font-medium hover:underline">
                    View
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
