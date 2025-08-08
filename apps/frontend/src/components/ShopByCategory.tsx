import Link from 'next/link';
import { mockCategories } from '@/modules/categories/mockCategories';

export default function ShopByCategory() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-brown-800 text-center mb-8">
        Shop by Category
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-7">
        {mockCategories.map((cat) => (
          <Link
            key={cat.key}
            href={cat.link}
            className="flex flex-col items-center bg-white rounded-2xl border border-olive-200 shadow-md p-5 cursor-pointer group transition hover:border-accent hover:shadow-xl hover:-translate-y-2"
          >
            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">
              {cat.icon}
            </span>
            <span className="font-serif font-semibold text-brown-800 mb-1 text-lg text-center">
              {cat.label}
            </span>
            <span className="text-olive-dark text-sm text-center">{cat.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
