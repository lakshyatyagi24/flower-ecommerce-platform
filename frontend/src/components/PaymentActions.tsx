"use client";

import React from "react";
import type { PayController } from "@/lib/use-pay-for-order";

/** Notice + Pay now / Switch to COD (with inline confirm) / Check status buttons. */
export default function PaymentActions({
  pay,
  orderId,
  allowSwitch = true,
}: {
  pay: PayController;
  orderId: number;
  allowSwitch?: boolean;
}) {
  const { notice, showCheck, busy, confirming } = pay;
  return (
    <div>
      {notice && (
        <div
          className="mt-4 px-4 py-3 rounded bg-amber-50 text-amber-800 text-sm"
          role={notice.kind === "alert" ? "alert" : "status"}
        >
          {notice.text}
        </div>
      )}
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void pay.payNow(orderId)}
          className="bg-olive-green text-white px-6 py-3 rounded-full font-semibold disabled:opacity-50"
        >
          Pay now
        </button>
        {allowSwitch && !confirming && (
          <button
            type="button"
            disabled={busy}
            onClick={pay.askSwitch}
            className="px-6 py-3 rounded-full font-semibold border border-olive-green text-olive-green disabled:opacity-50"
          >
            Switch to cash on delivery
          </button>
        )}
        {showCheck && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void pay.checkStatus(orderId)}
            className="px-6 py-3 rounded-full font-semibold underline underline-offset-4 disabled:opacity-50"
          >
            Check status
          </button>
        )}
      </div>
      {allowSwitch && confirming && (
        <div className="mt-4 px-4 py-3 rounded border border-olive-green/30 text-sm text-slate-800">
          <p>Switch to cash on delivery? Only do this if you have not paid.</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void pay.confirmSwitch(orderId)}
              className="bg-olive-green text-white px-4 py-2 rounded-full font-semibold disabled:opacity-50"
            >
              Yes, switch
            </button>
            <button type="button" onClick={pay.cancelSwitch} className="underline underline-offset-4">
              Keep online payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
