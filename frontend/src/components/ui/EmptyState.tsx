import Link from 'next/link';
import Container from './Container';

export default function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body?: string;
  cta?: { href: string; label: string };
}) {
  return (
    <Container className="my-16 text-center">
      <h3 className="font-display text-2xl">{title}</h3>
      {body && <p className="mt-2 text-sm opacity-70">{body}</p>}
      {cta && (
        <Link href={cta.href} className="mt-6 inline-block underline underline-offset-4">
          {cta.label}
        </Link>
      )}
    </Container>
  );
}
