import type { AdminOrder, AdminOrderPatch } from "@/lib/api";

export type EditState = {
  trackingNumber: string;
  courierName: string;
  adminNotes: string;
  shippingAddress: string;
  city: string;
  postalCode: string;
  customerPhone: string;
};

export const blankEdit: EditState = {
  trackingNumber: "",
  courierName: "",
  adminNotes: "",
  shippingAddress: "",
  city: "",
  postalCode: "",
  customerPhone: "",
};

export function editFromOrder(o: AdminOrder): EditState {
  return {
    trackingNumber: o.trackingNumber || "",
    courierName: o.courierName || "",
    adminNotes: o.adminNotes || "",
    shippingAddress: o.shippingAddress || "",
    city: o.city || "",
    postalCode: o.postalCode || "",
    customerPhone: o.customerPhone || "",
  };
}

const trimmedOrNull = (value: string): string | null => value.trim() || null;

export function editToPatch(edit: EditState): AdminOrderPatch {
  return {
    trackingNumber: trimmedOrNull(edit.trackingNumber),
    courierName: trimmedOrNull(edit.courierName),
    adminNotes: trimmedOrNull(edit.adminNotes),
    shippingAddress: trimmedOrNull(edit.shippingAddress),
    city: trimmedOrNull(edit.city),
    postalCode: trimmedOrNull(edit.postalCode),
    customerPhone: trimmedOrNull(edit.customerPhone),
  };
}
