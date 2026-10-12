import Link from "next/link";
import { focusRing } from "./styles";

/** Text wordmark in the display serif. */
export default function Wordmark({ onClick, className = "" }: { onClick?: () => void; className?: string }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center font-display text-[26px] font-medium leading-none tracking-[0.01em] text-charcoal ${focusRing} ${className}`.trim()}
    >
      Fresh Petals
    </Link>
  );
}
