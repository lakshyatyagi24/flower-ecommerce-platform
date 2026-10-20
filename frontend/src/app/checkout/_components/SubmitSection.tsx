import React from "react";
import Button from "@/components/ui/Button";

type SubmitSectionProps = {
  submitting: boolean;
  couponBusy: boolean;
  blockMessage: string | null;
  paymentMethod: "COD" | "RAZORPAY";
};

function submitLabel(submitting: boolean, paymentMethod: "COD" | "RAZORPAY") {
  if (submitting) return "Placing order…";
  return paymentMethod === "RAZORPAY" ? "Place order & pay" : "Place order";
}

export default function SubmitSection({ submitting, couponBusy, blockMessage, paymentMethod }: SubmitSectionProps) {
  return (
    <div>
      <Button
        type="submit"
        size="lg"
        disabled={submitting || Boolean(blockMessage) || couponBusy}
        aria-describedby={blockMessage ? "checkout-gate" : undefined}
        className="w-full"
      >
        {submitLabel(submitting, paymentMethod)}
      </Button>
      {blockMessage && (
        <p id="checkout-gate" className="mt-3 text-sm text-charcoal">
          {blockMessage}
        </p>
      )}
      <ul className="mt-4 space-y-1 text-left text-sm text-stone-dark">
        {paymentMethod === "RAZORPAY" && <li>Secure payment via Razorpay.</li>}
        <li>We&apos;ll email your order confirmation.</li>
      </ul>
    </div>
  );
}
