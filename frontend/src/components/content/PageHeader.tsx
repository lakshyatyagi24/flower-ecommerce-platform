import type { ReactNode } from 'react';
import Eyebrow from '@/components/ui/Eyebrow';

/** Page title block for content pages: eyebrow, display heading, optional lead paragraph. */
export default function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="max-w-[720px]">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="type-h1 mt-4 text-charcoal">{title}</h1>
      {intro ? <p className="mt-6 text-lg leading-relaxed text-stone-dark">{intro}</p> : null}
      {children}
    </header>
  );
}
