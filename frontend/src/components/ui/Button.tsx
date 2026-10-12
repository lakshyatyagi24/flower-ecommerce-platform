import Link from 'next/link';
import type { ComponentProps } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center font-sans text-[13px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none aria-disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-charcoal text-ivory rounded-sm hover:bg-moss',
  outline: 'border border-charcoal text-charcoal rounded-sm hover:bg-charcoal hover:text-ivory',
  ghost: 'text-charcoal underline underline-offset-4 decoration-stone hover:decoration-charcoal',
};

const sizes: Record<Size, string> = { md: 'h-11 px-6', lg: 'h-14 px-8' };

type Props = { variant?: Variant; size?: Size; href?: string } & Omit<ComponentProps<'button'>, 'type'> & {
    type?: 'button' | 'submit' | 'reset';
  };

export default function Button({ variant = 'primary', size = 'md', href, className = '', type = 'button', ...rest }: Props) {
  const cls = [base, variants[variant], variant === 'ghost' ? 'py-2' : sizes[size], className].filter(Boolean).join(' ');
  if (href) return <Link href={href} className={cls}>{rest.children}</Link>;
  return <button type={type} className={cls} {...rest} />;
}
