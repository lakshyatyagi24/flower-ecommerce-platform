import Image from 'next/image';
import Link from 'next/link';
import heroImage from '../assets/hero.jpg';
import { mockProducts } from '@/modules/products/mockProducts';
import eventImage from '../assets/event.png';

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <section className="relative max-w-4xl mx-auto py-10 px-4">
        <div className="rounded-xl overflow-hidden relative mb-12 shadow-lg min-h-[320px]">
          <Image
            src={heroImage}
            alt="Rustic bouquet on a wooden table"
            fill
            priority
            className="object-cover brightness-90 saturate-150 w-full h-80"
            style={{ minHeight: 320, minWidth: "100%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-beige/90 via-beige/75 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center items-center z-10 text-center px-4">
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
              Petal & Twine
            </h1>
            <p className="text-xl md:text-2xl text-white mb-1 font-medium drop-shadow-sm max-w-2xl">
              Artisanal bouquets for every occasion
            </p>
            <span className="text-base md:text-lg text-white mb-4 block font-serif italic">
              Lovingly crafted florals, delivered fresh
            </span>
            <div className="flex flex-col sm:flex-row gap-3 mt-1 justify-center">
              <Link href="/products" className="button-primary text-base font-semibold px-8 py-3 shadow-md">
                Shop Now
              </Link>
              <Link
                href="/events"
                className="border border-accent text-accent bg-white/70 hover:bg-accent hover:text-white transition font-semibold text-base rounded-lg px-8 py-3"
              >
                Plan an Event
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-16">
        <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 text-brown-800 text-center">
          Featured Collection
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {mockProducts.slice(0, 3).map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-olive-200 flex flex-col"
            >
              <Image
                src={product.image}
                alt={product.name}
                width={320}
                height={290}
                className="w-full h-72 object-cover border-b border-olive-200 rounded-t-xl"
              />
              <div className="p-5 flex-1 flex flex-col">
                <span className="font-serif font-semibold text-brown-800 mb-1">{product.name}</span>
                <span className="text-sm text-gray-600 mb-4">{product.description}</span>
                <span className="text-green-700 text-base font-semibold mt-auto">
                  ${product.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-20 mb-16">
        <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3 text-brown-800 text-center">
          Event Booking & Services
        </h2>
        <p className="text-md md:text-lg text-center max-w-2xl mx-auto text-gray-700 mb-8">
          Let us bring the beauty of nature to your special event. From intimate gatherings to grand
          celebrations, our bespoke floral designs will create an unforgettable atmosphere.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 ">
          {/* Replace src with your own event images */}
          <div className="bg-white rounded-xl shadow-md flex flex-col items-center p-5">
            <Image
              src={eventImage}
              alt="Wedding setup"
              width={240}
              height={210}
              className="rounded-md mb-4"
            />
            <span className="font-serif font-semibold text-brown-800">Weddings</span>
          </div>
          <div className="bg-white rounded-xl shadow-md flex flex-col items-center p-5">
            <Image
              src={eventImage}
              alt="Corporate event setup"
              width={240}
              height={210}
              className="rounded-md mb-4"
            />
            <span className="font-serif font-semibold text-brown-800">Corporate Events</span>
          </div>
          <div className="bg-white rounded-xl shadow-md flex flex-col items-center p-5">
            <Image
              src={eventImage}
              alt="Personal celebrations"
              width={240}
              height={210}
              className="rounded-md mb-4"
            />
            <span className="font-serif font-semibold text-brown-800">Personal Celebrations</span>
          </div>
        </div>
        <div className="flex justify-center mt-8">
          <a href="/events" className="button-primary">
            Book Now
          </a>
        </div>
      </section>
    </main>
  );
}
