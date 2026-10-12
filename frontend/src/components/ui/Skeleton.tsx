/** Neutral placeholder block. Pulse is disabled under prefers-reduced-motion. */
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`bg-stone-light/40 rounded-sm animate-pulse motion-reduce:animate-none ${className}`.trim()} />;
}
