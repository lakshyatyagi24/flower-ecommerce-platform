import { formatINR } from '@/lib/format';

export default function Price({ amount, unit, className = '' }: { amount: number; unit?: string; className?: string }) {
  return (
    <span className={`text-charcoal ${className}`.trim()}>
      <span>{formatINR(amount)}</span>
      {unit && <span className="ml-1 text-sm text-stone-dark">{unit}</span>}
    </span>
  );
}
