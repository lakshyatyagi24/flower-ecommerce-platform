import type { ReactNode } from "react";

/** Single centred 420px column on ivory for the sign-in / register / password pages. No card, no shadow. */
export default function AuthLayout({
  title,
  intro,
  footer,
  children,
}: {
  title: string;
  intro?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main>
      <div className="mx-auto w-full max-w-[420px] px-5 py-12 md:py-20">
        <h1 className="type-h2 text-center">{title}</h1>
        {intro && <p className="mt-4 text-center text-base leading-relaxed text-stone-dark">{intro}</p>}
        <div className="mt-10">{children}</div>
        {footer && <div className="mt-8 border-t border-stone-light pt-8 text-center text-sm text-stone-dark">{footer}</div>}
      </div>
    </main>
  );
}

/** Status line for the auth forms. Errors use the danger hairline, success the moss one. Always announced. */
export function AuthMessage({ type, children }: { type: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role="alert"
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`mb-6 border px-4 py-3 text-sm leading-relaxed ${
        type === "error" ? "border-danger text-danger" : "border-moss text-charcoal"
      }`}
    >
      {children}
    </div>
  );
}
