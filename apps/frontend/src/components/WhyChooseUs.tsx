// If you put this in /components/WhyChooseUs.tsx
import { SparklesIcon, TruckIcon, UserGroupIcon } from '@heroicons/react/24/solid';

const Flower = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    className="mb-3 text-accent"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="16" cy="16" r="5" className="fill-current text-accent" />
    <path d="M16 2 V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M30 16 H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 30 V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M2 16 H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M25 7 L21 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M25 25 L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 25 L11 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M7 7 L11 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function WhyChooseUs() {
  // You can swap these out for your own SVGs or illustrations!
  const features = [
    {
      icon: <Flower />,
      title: 'Locally Sourced Blooms',
      desc: 'Fresh, seasonal flowers from trusted local growers for peak beauty and minimal footprint.',
    },
    {
      icon: <SparklesIcon className="w-8 h-8 text-accent mb-3" />,
      title: 'Rustic Artisan Styling',
      desc: 'Hand-crafted arrangements with unique, natural charm you won’t find anywhere else.',
    },
    {
      icon: <TruckIcon className="w-8 h-8 text-accent mb-3" />,
      title: 'Swift, Reliable Delivery',
      desc: 'Flexible delivery slots and real-time tracking—your blooms will always arrive fresh.',
    },
    {
      icon: <UserGroupIcon className="w-8 h-8 text-accent mb-3" />,
      title: 'Bespoke Event Design',
      desc: 'Personalized event florals for weddings, celebrations, and brands—styled to your vision.',
    },
  ];

  return (
    <section className="bg-beige/70 rounded-2xl px-4 py-14 mt-20 mb-6 max-w-5xl mx-auto shadow-lg border border-olive-200">
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-brown-800 text-center mb-9">
        Why Choose Petal & Twine?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col items-center text-center p-3 px-1 transition-transform hover:-translate-y-2"
          >
            {feature.icon}
            <h3 className="font-serif text-lg font-semibold text-brown-800 mb-2">
              {feature.title}
            </h3>
            <span className="text-gray-700 text-sm">{feature.desc}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
