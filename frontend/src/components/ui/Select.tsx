"use client";
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { useControlProps } from './Field';
import { controlBase, controlBorder } from './form-styles';

/** Native select (best mobile ergonomics) with the shared control styling. */
const Select = forwardRef<HTMLSelectElement, ComponentPropsWithoutRef<'select'>>(function Select(
  { className = '', children, ...rest },
  ref,
) {
  const c = useControlProps(rest);
  return (
    <select
      {...rest}
      ref={ref}
      id={c.id}
      aria-describedby={c['aria-describedby']}
      aria-invalid={c['aria-invalid']}
      className={`${controlBase} ${controlBorder(c.invalid)} pr-10 ${className}`.trim()}
    >
      {children}
    </select>
  );
});

export default Select;
