import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CouponErrors } from '@/lib/coupon-form';

function FieldError({ id, message }: { id: string; message?: string }) {
  // Inline, not role=alert: the submit handler moves focus to the first invalid field instead.
  return message ? <p id={id} className="mt-1 text-xs text-red-700">{message}</p> : null;
}

type CouponFieldProps = Omit<ComponentProps<typeof Input>, 'id' | 'onChange'> & {
  name: keyof CouponErrors;
  label: string;
  error?: string;
  onValue: (value: string) => void;
};

/** A labelled input wired to its inline error (`coupon-<name>` / `coupon-<name>-error`). */
export function CouponField({ name, label, error, onValue, ...inputProps }: CouponFieldProps) {
  const id = `coupon-${name}`;
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        onChange={(e) => onValue(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/** Props shared by the decimal money/percent inputs. */
export const DECIMAL_PROPS = { type: 'number', inputMode: 'decimal', min: '0', step: 'any' } as const;
