'use client';
import { useEffect, useRef, useState } from 'react';

const messages = [
  '🌼 Free delivery on orders over $75!',
  '🌿 Use code RUSTIC20 for 20% off your first bouquet.',
  '🚚 Order by 3pm for same-day delivery (Mon-Sat).',
  '💐 Planning an event? Ask about bespoke packages!',
  '✨ All blooms locally sourced for peak freshness.',
];

export default function InfoMarquee() {
  const [idx, setIdx] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setIdx((i) => (i + 1) % messages.length), 4500);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [idx]);

  return (
    <div className="w-full bg-accent text-primary font-semibold tracking-wide text-sm md:text-base py-2 overflow-hidden shadow border border-primary select-none">
      <div className="relative h-6 md:h-7 flex items-center justify-center">
        <span
          key={idx}
          className="absolute transition-all duration-700 will-change-transform animate-marquee"
          style={{
            animation: 'slide-in 0.65s cubic-bezier(.45,.05,.44,1.16) both',
          }}
          aria-live="polite"
        >
          {messages[idx]}
        </span>
      </div>
      <div className="absolute right-4 top-0 h-full flex items-center gap-1">
        {messages.map((_, i) => (
          <button
            key={i}
            aria-label={`Show announcement ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-2.5 w-2.5 rounded-full border transition ${i === idx ? 'bg-white border-white' : 'bg-accent border-white/30'}`}
            style={{ opacity: i === idx ? 1 : 0.5 }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes slide-in {
          0% {
            opacity: 0;
            transform: translateY(15px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
