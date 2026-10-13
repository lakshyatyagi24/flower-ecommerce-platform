import Link from 'next/link';
import Container from './Container';

export default function ErrorState({
  message,
  onRetry,
  link,
}: {
  message: string;
  onRetry?: () => void;
  link?: { href: string; label: string };
}) {
  return (
    <Container role="alert" className="my-10 text-center">
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 underline underline-offset-4">
          Try again
        </button>
      )}
      {link && (
        <Link href={link.href} className={`mt-4 inline-block underline underline-offset-4 ${onRetry ? "ml-6" : ""}`}>
          {link.label}
        </Link>
      )}
    </Container>
  );
}
