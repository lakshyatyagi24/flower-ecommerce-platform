import type { AdminEnquiryStatus } from "@/lib/api";

export const STATUSES: AdminEnquiryStatus[] = ["NEW", "CONTACTED", "QUOTED", "CONVERTED", "CLOSED"];

const STATUS_VARIANTS: Record<AdminEnquiryStatus, "default" | "secondary" | "destructive" | "outline"> = {
  NEW: "destructive",
  CONTACTED: "outline",
  QUOTED: "secondary",
  CONVERTED: "default",
  CLOSED: "outline",
};

export function statusVariant(status: AdminEnquiryStatus) {
  return STATUS_VARIANTS[status];
}

/** "NEW" -> "New" */
export function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function fmtDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function fmtDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

// 10-digit stored numbers get +91 so the dialer link is unambiguous.
export function telNumber(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return /^\d{10}$/.test(cleaned) ? `+91${cleaned}` : cleaned;
}

export function whatsappUrl(phone: string, customerName: string) {
  let digits = phone.replace(/\D+/g, "");
  if (digits.length < 8) return null;
  // Backend stores normalised 10-digit Indian numbers; wa.me needs the country code.
  if (digits.length === 10) digits = `91${digits}`;
  const text = `Hi ${customerName}, this is the team at Fresh Petals India. We received your enquiry — `;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
