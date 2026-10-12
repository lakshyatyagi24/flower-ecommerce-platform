import Link from 'next/link';
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'md' | 'lg';

type Common = { variant?: Variant; /** Ignored for the ghost variant (a text link). */ size?: Size };
type AsButton = Common & ComponentPropsWithoutRef<'button'> & { href?: undefined };
type AsLink = Common &
  Omit<ComponentPropsWithoutRef<typeof Link>, 'href'> & { href: string; disabled?: boolean };
export type ButtonProps = AsButton | AsLink;

const base =
  'inline-flex items-center justify-center font-sans text-[13px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary: 'bg-charcoal text-ivory rounded-sm hover:bg-moss disabled:bg-stone-light disabled:text-stone-dark disabled:hover:bg-stone-light',
  outline:
    'border border-charcoal text-charcoal rounded-sm hover:bg-charcoal hover:text-ivory ' +
    'disabled:border-stone-light disabled:text-stone-dark disabled:hover:bg-transparent disabled:hover:text-stone-dark',
  ghost: 'text-charcoal underline underline-offset-4 decoration-stone hover:decoration-charcoal disabled:text-stone disabled:hover:decoration-stone',
};

// Same look for a disabled <a> (which has no :disabled), expressed with aria-disabled.
const disabledLink: Record<Variant, string> = {
  primary: 'bg-stone-light text-stone-dark hover:bg-stone-light',
  outline: 'border-stone-light text-stone-dark hover:bg-transparent hover:text-stone-dark',
  ghost: 'text-stone hover:decoration-stone',
};

const sizes: Record<Size, string> = { md: 'h-11 px-6', lg: 'h-14 px-8' };

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(props, ref) {
  const { variant = 'primary', size = 'md', className = '', ...rest } = props;
  const sizing = variant === 'ghost' ? 'min-h-[44px] py-2' : sizes[size];

  if (rest.href !== undefined) {
    const { href, disabled, onClick, ...anchor } = rest as AsLink;
    const cls = [base, variants[variant], sizing, disabled ? `${disabledLink[variant]} pointer-events-none cursor-not-allowed` : '', className]
      .filter(Boolean)
      .join(' ');
    if (disabled) {
      // No href and no handlers: natively inert, and safe to render from a server component.
      const { target: _t, rel: _r, prefetch: _p, replace: _re, scroll: _s, shallow: _sh, passHref: _ph, legacyBehavior: _lb, locale: _l, ...plain } = anchor as Record<string, unknown>;
      return <a {...(plain as ComponentPropsWithoutRef<'a'>)} ref={ref as React.Ref<HTMLAnchorElement>} className={cls} role="link" aria-disabled="true" tabIndex={-1} />;
    }
    return <Link {...anchor} href={href} ref={ref as React.Ref<HTMLAnchorElement>} className={cls} onClick={onClick} />;
  }

  const { type = 'button', ...button } = rest as AsButton;
  const cls = [base, variants[variant], sizing, className].filter(Boolean).join(' ');
  return <button {...button} type={type} ref={ref as React.Ref<HTMLButtonElement>} className={cls} />;
});

export default Button;
