import type { ReactNode } from 'react';
import Container from '@/components/ui/Container';
import PageHeader from './PageHeader';
import { formatLongDate } from '@/lib/content';

/**
 * Long-form legal page: 720px reading column, display headings, real "Last updated" date.
 * `updated` is an ISO date constant from lib/content.ts (never the render date).
 */
export default function LegalDocument({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <main className="py-14 md:py-20">
      <Container>
        <PageHeader eyebrow="Legal" title={title} intro={intro}>
          <p className="mt-6 text-sm text-stone-dark">
            Last updated <time dateTime={updated}>{formatLongDate(updated)}</time>
          </p>
        </PageHeader>
        <div className="mt-12 max-w-[720px] border-t border-stone-light">{children}</div>
      </Container>
    </main>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="mt-10 space-y-4 text-base leading-[1.75] text-charcoal [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-stone hover:[&_a]:decoration-charcoal [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-stone">
      <h2 className="type-h3 text-charcoal">{heading}</h2>
      {children}
    </section>
  );
}
