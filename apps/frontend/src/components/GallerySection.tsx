import Image from 'next/image';
import Link from 'next/link';
import { mockGalleryImages } from '@/modules/gallery/mockGalleryImages';

export default function GallerySection() {
  return (
    <section className="py-16 max-w-6xl mx-auto px-4">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-brown-800 mb-9 text-center">
        Gallery & Inspiration
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        {mockGalleryImages.slice(0, 6).map((image) => (
          <div
            key={image.id}
            className="relative group w-full aspect-[4/3] rounded-xl overflow-hidden shadow-md border border-olive-200"
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brown-800/60 to-transparent opacity-0 group-hover:opacity-90 transition-opacity rounded-xl" />
            <span className="absolute bottom-2 left-2 text-white font-serif font-semibold text-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
              {image.alt}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Link
          href="/gallery"
          className="border border-accent text-accent font-semibold px-7 py-3 rounded-full bg-white transition hover:bg-accent hover:text-white text-lg shadow-sm"
        >
          See More
        </Link>
      </div>
    </section>
  );
}
