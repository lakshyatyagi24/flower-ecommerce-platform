"use client";

import { useEffect, useState } from "react";
import { adminApi, AdminOrder } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/error-message";
import { blankEdit, editFromOrder, editToPatch, EditState } from "./edit-state";

/** The order open in the detail dialog, its editable fulfillment fields, and the status/details actions. */
export function useOrderDetail(fetchOrders: () => void) {
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [edit, setEdit] = useState<EditState>(blankEdit);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const { addToast } = useToast();

  // Sync the edit form whenever a different order is selected.
  useEffect(() => {
    setEdit(selected ? editFromOrder(selected) : blankEdit);
  }, [selected]);

  const setEditField = (key: keyof EditState, value: string) => setEdit((s) => ({ ...s, [key]: value }));

  const handleStatusChange = async (orderId: number, status: string) => {
    setUpdatingStatus(true);
    try {
      setSelected(await adminApi.updateOrderStatus(orderId, status));
      addToast({ type: "success", title: "Status updated", description: `Order #${orderId} is now ${status}.` });
      fetchOrders();
    } catch (err) {
      addToast({ type: "error", title: "Error", description: errorMessage(err, "Failed to update") });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!selected) return;
    setSavingDetails(true);
    try {
      setSelected(await adminApi.updateOrder(selected.id, editToPatch(edit)));
      addToast({ type: "success", title: "Saved", description: "Order details updated." });
      fetchOrders();
    } catch (err) {
      addToast({ type: "error", title: "Error", description: errorMessage(err, "Failed to save") });
    } finally {
      setSavingDetails(false);
    }
  };

  return {
    selected,
    setSelected,
    edit,
    setEditField,
    updatingStatus,
    savingDetails,
    handleStatusChange,
    handleSaveDetails,
  };
}

export type OrderDetailState = ReturnType<typeof useOrderDetail>;
