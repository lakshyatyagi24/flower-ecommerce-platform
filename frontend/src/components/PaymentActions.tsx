"use client";

import React from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import type { PayController } from "@/lib/use-pay-for-order";

/** Notice + Pay now / Switch to COD (with inline confirm) / Check status buttons. */
export default function PaymentActions({
  pay,
  orderId,
  allowSwitch = true,
  allowPay = true,
}: {
  pay: PayController;
  orderId: number;
  allowSwitch?: boolean;
  /** False when online payments are switched off: the order can only be switched to cash on delivery. */
  allowPay?: boolean;
}) {
  const { notice, showCheck, busy, confirming, switched } = pay;
  const noticeBox = notice && (
    <div
      className={`mt-6 border px-4 py-3 text-sm leading-relaxed text-charcoal ${
        notice.kind === "alert" ? "border-danger" : "border-stone-light"
      }`}
      role={notice.kind === "alert" ? "alert" : "status"}
    >
      {notice.text}
      {notice.link && (
        <>
          {" "}
          <Link href={notice.link.href} className="underline underline-offset-4 hover:text-moss">
            {notice.link.label}
          </Link>
        </>
      )}
    </div>
  );
  // Paid on an order that was already switched to COD: only the refund notice remains.
  if (switched) return <div>{noticeBox}</div>;
  return (
    <div>
      {noticeBox}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {allowPay && (
          <Button type="button" disabled={busy} onClick={() => void pay.payNow(orderId)} className="w-full sm:w-auto">
            Pay now
          </Button>
        )}
        {allowSwitch && !confirming && (
          <Button type="button" variant="outline" disabled={busy} onClick={pay.askSwitch} className="w-full sm:w-auto">
            Switch to cash on delivery
          </Button>
        )}
        {showCheck && (
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void pay.checkStatus(orderId)}>
            Check status
          </Button>
        )}
      </div>
      {allowSwitch && confirming && (
        <div className="mt-6 border border-charcoal px-4 py-4 text-sm text-charcoal">
          <p>Switch to cash on delivery? Only do this if you have not paid.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" disabled={busy} onClick={() => void pay.confirmSwitch(orderId)} className="w-full sm:w-auto">
              Yes, switch
            </Button>
            <Button type="button" variant="ghost" onClick={pay.cancelSwitch}>
              Keep online payment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
