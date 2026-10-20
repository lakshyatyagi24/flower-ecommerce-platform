import type { AdminOrder } from "@/lib/api";
import { hasCaptureTrace } from "@/lib/refund-note";

export const STATUSES = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

export const ATTENTION_VALUES = ["refund", "mismatch", "awaiting"] as const;

export const NOTE_CHANGED_MSG = "The note was changed meanwhile";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  PENDING: "outline",
  PAID: "default",
  SHIPPED: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

const TONE_VARIANTS: Record<string, BadgeVariant> = {
  success: "default",
  warning: "secondary",
  danger: "destructive",
};

export function badgeVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[status] ?? "outline";
}

export function toneVariant(tone: "neutral" | "success" | "warning" | "danger"): BadgeVariant {
  return TONE_VARIANTS[tone] ?? "outline";
}

/** A refund can be recorded for a paid order, or an unpaid one that still shows a captured payment. */
export function canMarkRefunded(order: AdminOrder): boolean {
  return order.paymentStatus === "PAID" || (order.paymentStatus === "UNPAID" && hasCaptureTrace(order.refundNote));
}
