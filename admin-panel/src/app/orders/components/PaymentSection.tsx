import { Copy, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AdminOrder } from "@/lib/api";
import { splitRefundNote } from "@/lib/refund-note";
import { canMarkRefunded } from "../constants";
import type { RefundState } from "../useRefundPayment";
import { PaymentBadge } from "./PaymentBadge";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      {children}
    </div>
  );
}

function RazorpayId({ id, onCopy }: { id: string | null | undefined; onCopy: (text: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">Razorpay payment ID: </span>
      {id ? (
        <>
          <span className="font-mono break-all">{id}</span>
          <Button type="button" variant="outline" size="sm" aria-label="Copy Razorpay payment ID" onClick={() => onCopy(id)}>
            <Copy className="h-3 w-3" />
          </Button>
        </>
      ) : (
        "—"
      )}
    </div>
  );
}

function PaymentFacts({ order, onCopy }: { order: AdminOrder; onCopy: (text: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
      <Fact label="Method">{order.paymentMethod === "RAZORPAY" ? "Online (Razorpay)" : "Cash on delivery"}</Fact>
      <Fact label="Payment status">{order.paymentStatus}</Fact>
      <Fact label="Paid at">{order.paidAt ? new Date(order.paidAt).toLocaleString() : "—"}</Fact>
      <RazorpayId id={order.razorpayPaymentId} onCopy={onCopy} />
    </div>
  );
}

function SystemNotes({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm space-y-1">
      <div className="font-medium">Automatic payment notes (read-only)</div>
      {lines.map((line, i) => (
        <div key={i} className="flex gap-2">
          <Badge variant="outline" className="shrink-0">Automatic</Badge>
          <span className="font-mono text-xs break-all">{line}</span>
        </div>
      ))}
    </div>
  );
}

function RefundNoteField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label htmlFor="refundNote">Your refund note</Label>
      <textarea
        id="refundNote"
        rows={3}
        maxLength={900}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="e.g. Refunded in Razorpay on 12 Oct, refund ID rfnd_…"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Internal only. The automatic lines above are kept by the system and cannot be edited.
      </p>
    </div>
  );
}

function Spinner({ show }: { show: boolean }) {
  return show ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null;
}

function RefundConfirm({ stillActive, refund }: { stillActive: boolean; refund: RefundState }) {
  return (
    <div role="alertdialog" aria-label="Confirm refund" className="rounded-md border p-3 text-sm space-y-2">
      <p className="font-medium">
        Mark this order as refunded? Only do this after you have refunded the customer in Razorpay.
      </p>
      {stillActive && (
        <p className="text-destructive">
          This order is still active — cancel it too so the stock is released and it is not fulfilled.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={refund.paymentBusy} onClick={() => refund.submitPayment(true)}>
          <Spinner show={refund.paymentBusy} />
          Yes, mark refunded
        </Button>
        <Button size="sm" variant="outline" disabled={refund.paymentBusy} onClick={() => refund.setConfirmingRefund(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

type RefundActionsProps = { canRefund: boolean; noteUnchanged: boolean; refund: RefundState };

function RefundActions({ canRefund, noteUnchanged, refund }: RefundActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-end">
      <Button variant="outline" disabled={refund.paymentBusy || noteUnchanged} onClick={() => refund.submitPayment(false)}>
        <Spinner show={refund.paymentBusy} />
        Save note
      </Button>
      {canRefund && (
        <Button variant="destructive" disabled={refund.paymentBusy} onClick={refund.startRefundConfirm}>
          Mark refunded
        </Button>
      )}
    </div>
  );
}

type PaymentSectionProps = { order: AdminOrder; refund: RefundState; onCopy: (text: string) => void };

export function PaymentSection({ order, refund, onCopy }: PaymentSectionProps) {
  const split = splitRefundNote(order.refundNote);
  const noteUnchanged = refund.refundAdmin.trim() === split.admin;
  return (
    <div className="border-t pt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">Payment</h3>
        <PaymentBadge order={order} />
      </div>
      <PaymentFacts order={order} onCopy={onCopy} />
      <SystemNotes lines={split.system} />
      <RefundNoteField value={refund.refundAdmin} onChange={refund.setRefundAdmin} />
      {refund.paymentError && (
        <p role="alert" className="text-sm text-destructive">
          {refund.paymentError}
        </p>
      )}
      {refund.confirmingRefund ? (
        <RefundConfirm stillActive={order.status !== "CANCELLED"} refund={refund} />
      ) : (
        <RefundActions canRefund={canMarkRefunded(order)} noteUnchanged={noteUnchanged} refund={refund} />
      )}
    </div>
  );
}
