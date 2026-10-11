import Link from 'next/link';

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
    <div className="section-shell my-16 text-center">
      <h3 className="font-serif text-2xl">{title}</h3>
      {body && <p className="mt-2 text-sm opacity-70">{body}</p>}
      {cta && (
        <Link href={cta.href} className="mt-6 inline-block underline underline-offset-4">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
