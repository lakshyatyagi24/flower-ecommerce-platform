"use client";
import { createContext, useContext, useId, type ReactNode } from 'react';

type FieldCtx = { id: string; describedBy?: string; invalid: boolean; optional: boolean };
const Ctx = createContext<FieldCtx | null>(null);

type OwnProps = { id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling' };

/** Merges a control's own props with the surrounding Field (id, aria-describedby, aria-invalid). */
export function useControlProps(own: OwnProps) {
  const field = useContext(Ctx);
  const fallbackId = useId();
  const id = own.id ?? field?.id ?? fallbackId;
  const describedBy = [own['aria-describedby'], field?.describedBy].filter(Boolean).join(' ') || undefined;
  const invalid = Boolean(field?.invalid) || own['aria-invalid'] === true || own['aria-invalid'] === 'true';
  const required = field ? !field.optional : undefined;
  return { id, 'aria-describedby': describedBy, 'aria-invalid': invalid ? (true as const) : undefined, 'aria-required': required, invalid };
}

type FieldProps = {
  label: ReactNode;
  /** Force the control id (useful when an error summary links to it). */
  id?: string;
  hint?: ReactNode;
  error?: string | null;
  /** Optional fields say so; required is the default and is announced to screen readers only. */
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Label above a control, optional hint, inline error. Hint and error ids are wired into the control's
 * aria-describedby by Input / Textarea / Select placed inside.
 */
export default function Field({ label, id, hint, error, optional = false, className = '', children }: FieldProps) {
  const auto = useId();
  const base = id ?? auto;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <Ctx.Provider value={{ id: base, describedBy, invalid: Boolean(error), optional }}>
      <div className={className}>
        <label htmlFor={base} className="mb-2 block text-sm text-charcoal">
          {label}
          {optional ? <span className="ml-1.5 text-stone-dark">(optional)</span> : <span className="sr-only"> (required)</span>}
        </label>
        {children}
        {hint && (
          <p id={hintId} className="mt-2 text-sm text-stone-dark">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Ctx.Provider>
  );
}
