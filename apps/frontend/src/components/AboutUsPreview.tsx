import Link from 'next/link';

export default function AboutUsPreview() {
  return (
    <section className="max-w-3xl mx-auto my-16 px-4 py-10 text-center bg-beige/70 border border-olive-200 rounded-2xl shadow-lg">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-brown-800 mb-4">
        About Petal & Twine
      </h2>
      <p className="text-primary text-base md:text-lg mb-5 leading-relaxed">
        At <span className="font-serif font-semibold text-accent">Petal & Twine</span>, we believe
        flowers should echo the authentic beauty of nature. Our bouquets and event florals are
        thoughtfully sourced from local growers, hand-arranged with rustic artistry, and delivered
        with genuine care.
        <br />
        <br />
        Whether you’re marking life’s milestones or just brightening a day, we strive to make every
        arrangement a personal, memorable experience.
      </p>
      <Link
        href="/about"
        className="inline-block mt-2 px-8 py-2 border border-accent rounded-full text-accent font-semibold bg-white hover:bg-accent hover:text-white transition shadow focus:outline-none"
      >
        Learn More
      </Link>
    </section>
  );
}
