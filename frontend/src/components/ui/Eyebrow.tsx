import type { ReactNode } from 'react';

/** Small uppercase tracked label. stone-dark keeps 11px text above AA contrast on ivory. */
export default function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-medium uppercase tracking-[0.16em] text-stone-dark ${className}`.trim()}>{children}</p>
  );
}
