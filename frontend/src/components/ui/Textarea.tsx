"use client";
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { useControlProps } from './Field';
import { controlBase, controlBorder } from './form-styles';

const Textarea = forwardRef<HTMLTextAreaElement, ComponentPropsWithoutRef<'textarea'>>(function Textarea(
  { className = '', ...rest },
  ref,
) {
  const c = useControlProps(rest);
  return (
    <textarea
      {...rest}
      ref={ref}
      id={c.id}
      aria-describedby={c['aria-describedby']}
      aria-invalid={c['aria-invalid']}
      className={`${controlBase} ${controlBorder(c.invalid)} resize-y py-3 leading-relaxed ${className}`.trim()}
    />
  );
});

export default Textarea;
