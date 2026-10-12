"use client";
import { forwardRef, useState, type ComponentPropsWithoutRef } from 'react';
import { useControlProps } from './Field';
import { controlBase, controlBorder, focusRing } from './form-styles';

export type InputProps = ComponentPropsWithoutRef<'input'>;

const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className = '', ...rest }, ref) {
  const c = useControlProps(rest);
  return (
    <input
      {...rest}
      ref={ref}
      id={c.id}
      aria-describedby={c['aria-describedby']}
      aria-invalid={c['aria-invalid']}
      className={`${controlBase} ${controlBorder(c.invalid)} ${className}`.trim()}
    />
  );
});

export default Input;

/** Password field with a show/hide toggle. Only switches the input type; the value is untouched. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(function PasswordInput(
  { className = '', ...rest },
  ref,
) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input {...rest} ref={ref} type={shown ? 'text' : 'password'} className={`pr-20 ${className}`.trim()} />
      <button
        type="button"
        aria-pressed={shown}
        aria-label={shown ? 'Hide password' : 'Show password'}
        onClick={() => setShown((s) => !s)}
        className={`absolute right-1 top-1/2 inline-flex h-11 min-w-[4.25rem] -translate-y-1/2 items-center justify-center px-3 text-xs font-medium uppercase tracking-[0.12em] text-stone-dark hover:text-charcoal ${focusRing}`}
      >
        {shown ? 'Hide' : 'Show'}
      </button>
    </div>
  );
});
