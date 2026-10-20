import React from "react";
import { requestSignIn } from "@/lib/sign-in-request";
import { textLink } from "@/components/ui/form-styles";

/** Shown to signed-out shoppers: no account is needed, with a way to sign in instead. */
export default function GuestNotice() {
  return (
    <section aria-labelledby="guest-checkout-title" className="border border-stone-light px-5 py-4">
      <h2 id="guest-checkout-title" className="font-display text-xl text-charcoal">
        Checkout as guest
      </h2>
      <p className="mt-2 text-sm text-stone-dark">
        No account needed. We&apos;ll email your order confirmation to the address below. Have an account?{" "}
        <button
          type="button"
          aria-label="Sign in to your account"
          onClick={(e) => requestSignIn(e.currentTarget)}
          className={`text-charcoal ${textLink}`}
        >
          Sign in
        </button>
      </p>
    </section>
  );
}
