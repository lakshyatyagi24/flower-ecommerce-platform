import Link from 'next/link';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function QuickEventPrompt() {
  return (
    <section className="mt-16 py-10 bg-accent/10 rounded-xl border border-accent shadow-lg max-w-3xl mx-auto text-center flex flex-col items-center justify-center">
      <CalendarDaysIcon className="w-12 h-12 text-accent mb-3" />
      <h2 className="font-serif text-xl md:text-2xl font-bold mb-2 text-brown-800">
        Planning an Event?
      </h2>
      <p className="text-md text-primary mb-4 max-w-md">
        Let us bring natural elegance to your celebration! Reserve artisan florals for weddings,
        parties, & more.
      </p>
      <Link
        href="/events/book"
        className="button-primary px-8 py-3 text-lg font-semibold shadow-md"
      >
        Start Event Booking
      </Link>
    </section>
  );
}
