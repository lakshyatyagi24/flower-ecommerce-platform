import { forwardRef, type ReactNode } from 'react';

export type FormErrorItem = { id: string; message: string };

type Props = {
  title?: string;
  /** Field-level problems; each links to its control. */
  items?: FormErrorItem[];
  /** A plain message (e.g. a server error). */
  children?: ReactNode;
  className?: string;
};

/**
 * Error summary for the top of a form. Focusable (tabIndex -1) so the page can move focus here after a failed
 * submit; screen readers read it as an alert.
 */
const FormError = forwardRef<HTMLDivElement, Props>(function FormError({ title, items = [], children, className = '' }, ref) {
  if (items.length === 0 && !children) return null;
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className={`rounded-sm border border-danger p-4 text-sm text-danger outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss ${className}`.trim()}
    >
      {title && <p className="font-medium">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
      {items.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {items.map((it) => (
            <li key={it.id}>
              <a href={`#${it.id}`} className="underline underline-offset-4">
                {it.message}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default FormError;
