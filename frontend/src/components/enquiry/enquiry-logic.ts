import type { api } from "@/lib/api";

export type EnquiryValues = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  quantity: string;
  eventDate: string;
  occasion: string;
  address: string;
  city: string;
  message: string;
};

export type EnquiryContext = {
  contact: boolean;
  source: string;
  productId: number | null;
  productName?: string;
};

type EnquiryPayload = Parameters<typeof api.createEnquiry>[0];

export const OCCASION_OPTIONS = ["Corporate / Office", "Wedding", "Anniversary", "Birthday", "Conference / Event", "Other"];

export function blankValues(occasion: string | undefined): EnquiryValues {
  return {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    quantity: "",
    eventDate: "",
    occasion: occasion || "",
    address: "",
    city: "",
    message: "",
  };
}

/** The "contact" variant sends only name, phone, email and message; the full variant sends everything filled in. */
export function buildEnquiryPayload(form: EnquiryValues, ctx: EnquiryContext): EnquiryPayload {
  if (ctx.contact) {
    return {
      customerName: form.customerName,
      customerEmail: form.customerEmail || undefined,
      customerPhone: form.customerPhone,
      message: form.message,
      source: ctx.source,
    };
  }
  return {
    productId: ctx.productId ?? undefined,
    productName: ctx.productName,
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    customerEmail: form.customerEmail || undefined,
    quantity: form.quantity ? Number(form.quantity) : undefined,
    eventDate: form.eventDate || undefined,
    occasion: form.occasion || undefined,
    address: form.address || undefined,
    city: form.city || undefined,
    message: form.message || undefined,
    source: ctx.source,
  };
}

export function enquiryErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Could not send your enquiry";
}
