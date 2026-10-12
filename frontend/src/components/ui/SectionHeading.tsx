import Link from 'next/link';
import Eyebrow from './Eyebrow';

export default function SectionHeading({
  eyebrow,
  title,
  intro,
  link,
  align = 'left',
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  link?: { href: string; label: string };
  align?: 'left' | 'center';
}) {
  const center = align === 'center';
  return (
    <div className={`gap-4 ${center ? 'flex flex-col items-center text-center' : 'flex flex-col md:flex-row md:items-end md:justify-between'}`}>
      <div className={`max-w-2xl ${center ? 'mx-auto' : ''}`}>
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h2 className="type-h2 text-charcoal">{title}</h2>
        {intro && <p className="mt-4 text-base leading-relaxed text-stone-dark">{intro}</p>}
      </div>
      {link && (
        <Link
          href={link.href}
          className="text-[13px] font-medium uppercase tracking-[0.12em] text-charcoal underline underline-offset-4 decoration-stone hover:decoration-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
