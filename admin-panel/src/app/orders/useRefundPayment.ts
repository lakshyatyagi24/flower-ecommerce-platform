"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi, AdminOrder, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/error-message";
import { splitRefundNote } from "@/lib/refund-note";
import { NOTE_CHANGED_MSG } from "./constants";

type Params = {
  selected: AdminOrder | null;
  setSelected: (order: AdminOrder) => void;
  fetchOrders: () => void;
};

/** Payment section state (admin part of the refund note only; system lines are read-only). */
export function useRefundPayment({ selected, setSelected, fetchOrders }: Params) {
  const [refundAdmin, setRefundAdmin] = useState("");
  const [confirmingRefund, setConfirmingRefund] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { addToast } = useToast();

  // The refund note textarea resets only when a different order is opened, so an unrelated action
  // (status change, Save details, refetch) never wipes what the admin is typing.
  const noteOrderIdRef = useRef<number | null>(null);
  useEffect(() => {
    const id = selected?.id ?? null;
    if (id === noteOrderIdRef.current) return;
    noteOrderIdRef.current = id;
    setRefundAdmin(splitRefundNote(selected?.refundNote).admin);
    setConfirmingRefund(false);
  }, [selected]);

  // Reload so the screen shows the real state; keep the typed note when only the note raced.
  const reloadAfterConflict = async (orderId: number, message: string) => {
    try {
      const fresh = await adminApi.getOrder(orderId);
      setSelected(fresh);
      if (!message.includes(NOTE_CHANGED_MSG)) setRefundAdmin(splitRefundNote(fresh.refundNote).admin);
    } catch {}
    fetchOrders();
  };

  // Saves the admin note and/or marks the order refunded. The server keeps the system lines itself.
  const submitPayment = async (markRefunded: boolean) => {
    if (!selected || paymentBusy) return;
    setPaymentBusy(true);
    setPaymentError(null);
    const typed = refundAdmin;
    try {
      const updated = await adminApi.updateOrder(
        selected.id,
        markRefunded ? { paymentStatus: "REFUNDED", refundNote: typed } : { refundNote: typed },
      );
      setSelected(updated);
      setRefundAdmin(splitRefundNote(updated.refundNote).admin);
      addToast({
        type: "success",
        title: markRefunded ? "Marked refunded" : "Note saved",
        description: markRefunded ? `Order #${selected.id} is now refunded.` : "Payment note updated.",
      });
      fetchOrders();
    } catch (err) {
      const message = errorMessage(err, "Failed to save");
      addToast({ type: "error", title: "Error", description: message });
      if (err instanceof ApiError && err.status === 409) await reloadAfterConflict(selected.id, message);
      setPaymentError(message);
    } finally {
      setPaymentBusy(false);
      setConfirmingRefund(false);
    }
  };

  const startRefundConfirm = () => {
    setPaymentError(null);
    setConfirmingRefund(true);
  };

  return {
    refundAdmin,
    setRefundAdmin,
    confirmingRefund,
    setConfirmingRefund,
    startRefundConfirm,
    paymentBusy,
    paymentError,
    clearPaymentError: () => setPaymentError(null),
    submitPayment,
  };
}

export type RefundState = ReturnType<typeof useRefundPayment>;
