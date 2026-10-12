import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { focusRing } from './form-styles';

type Props = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & { label: ReactNode };

/** Checkbox in a 44px-high row; the whole row is the hit area. */
const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox({ label, className = '', ...rest }, ref) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center gap-3 text-base text-charcoal ${className}`.trim()}>
      <input {...rest} ref={ref} type="checkbox" className={`h-5 w-5 shrink-0 accent-moss ${focusRing}`} />
      <span>{label}</span>
    </label>
  );
});

export default Checkbox;
