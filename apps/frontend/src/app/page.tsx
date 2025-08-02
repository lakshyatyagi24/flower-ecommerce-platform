export default function Home() {
  return (
    <section className="max-w-4xl mx-auto py-10 px-4">
      <div className="rounded-xl overflow-hidden relative mb-12 shadow-lg">
        <img src="/images/wildflower.jpg" alt="Rustic bouquet" className="w-full h-80 object-cover" />
        <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/30">
          <h1 className="font-serif text-5xl font-bold text-white drop-shadow-lg mb-2">
            Petal & Twine
          </h1>
          <p className="text-xl text-white mb-4">Artisanal bouquets for every occasion</p>
          <a
            href="/products"
            className="bg-accent text-white font-bold rounded-lg px-8 py-3 mt-2 hover:bg-orange-700 transition"
          >
            Shop Now
          </a>
        </div>
      </div>
    </section>
  );
}
