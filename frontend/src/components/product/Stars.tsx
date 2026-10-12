export default function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5 text-charcoal" fill={i < full ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2">
          <path d="M10 1.8l2.5 5.3 5.7.7-4.2 4 1.1 5.7L10 14.7 4.9 17.5 6 11.8 1.8 7.8l5.7-.7z" />
        </svg>
      ))}
    </span>
  );
}
