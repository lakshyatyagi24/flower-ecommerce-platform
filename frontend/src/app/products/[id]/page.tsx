import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api, formatINR, sanitizeImageUrl } from "@/lib/api";

const FALLBACK_IMG =
  "https://cdn.shopify.com/s/files/1/0047/4637/9362/files/IMG_5528.jpg?v=1709440820";

function toPlainText(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function ProductPage(props: any) {
  const slug = String(props?.params?.id ?? "").trim();
  if (!slug) return notFound();

  let product;
  try {
    product = await api.getProductBySlug(slug);
  } catch {
    return notFound();
  }

  const related = await api
    .listProducts({
      active: true,
      category: product.category?.slug,
      take: 5,
    })
    .then((res) => res.items.filter((p) => p.slug !== product.slug).slice(0, 4))
    .catch(() => []);

  const description = toPlainText(product.description);

  return (
    <main className="section-shell mt-12 mb-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="relative w-full h-[460px] lg:h-[560px] bg-white rounded-3xl overflow-hidden shadow-[0_28px_70px_rgba(24,20,13,0.14)]">
          <Image
            src={sanitizeImageUrl(product.image) ?? FALLBACK_IMG}
            alt={product.name}
            fill
            className="object-cover"
          />
          <div className="absolute top-4 left-4 pill bg-white/95 border-white/50">
            {product.category?.name ?? "Fresh flowers"}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="pill mb-3">Live product detail</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">
              {product.name}
            </h1>
            <p className="mt-3 text-slate-700 leading-relaxed">
              {description ||
                "Freshly sourced stems, hand-finished and delivered with careful hydration packaging."}
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-2xl font-bold text-olive-green">{formatINR(product.price)}</span>
            <span className="text-sm uppercase tracking-[0.16em] text-olive-green/70">
              Inclusive of taxes
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-olive-green/10 text-olive-green">
              Stock: {product.stock}
            </span>
          </div>

          <ul className="space-y-2 text-sm text-slate-700 bg-white/70 border border-olive-green/10 rounded-2xl p-4">
            <li>• Farm-to-door freshness checks on every shipment</li>
            <li>• Protective packaging for temperature and transit handling</li>
            <li>• Support for gifting, events and recurring floral requirements</li>
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-olive-green text-white px-6 py-2.5 text-sm font-semibold shadow-md"
            >
              Continue shopping
            </Link>
            <Link
              href="/contact"
              className="text-olive-green font-semibold underline-offset-4 hover:underline"
            >
              Need bulk quantity?
            </Link>
          </div>

          <div className="mt-4 text-xs uppercase tracking-[0.18em] text-olive-green/70">
            Synced product slug: {product.slug}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold text-slate-900 mb-5">Related picks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((item) => (
              <article key={item.id} className="section-card overflow-hidden border border-olive-green/10">
                <Link href={`/products/${item.slug}`} className="relative block w-full h-36">
                  <Image
                    src={sanitizeImageUrl(item.image) ?? FALLBACK_IMG}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </Link>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{item.name}</h3>
                  <p className="text-sm text-olive-green font-semibold mt-1">{formatINR(item.price)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
