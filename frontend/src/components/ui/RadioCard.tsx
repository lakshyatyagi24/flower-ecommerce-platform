"use client";
import { useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';

type Props = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'title'> & {
  title: ReactNode;
  description?: ReactNode;
};

/**
 * Selectable option card (payment method). The radio is real and visible; the whole card is the label, so the
 * hit area is generous. The selected card gets a charcoal hairline, an unselected one stays stone-light.
 */
export default function RadioCard({ title, description, className = '', id, ...rest }: Props) {
  const auto = useId();
  const base = id ?? auto;
  const descId = description ? `${base}-desc` : undefined;
  return (
    <label
      htmlFor={base}
      className={`flex min-h-14 cursor-pointer items-start gap-4 rounded-sm border border-stone p-4 transition-colors duration-200 hover:border-charcoal has-[:checked]:border-charcoal has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-moss ${className}`.trim()}
    >
      <input {...rest} id={base} type="radio" aria-describedby={descId} className="mt-0.5 h-5 w-5 shrink-0 accent-moss" />
      <span className="block">
        <span className="block text-base text-charcoal">{title}</span>
        {description && (
          <span id={descId} className="mt-1 block text-sm text-stone-dark">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
