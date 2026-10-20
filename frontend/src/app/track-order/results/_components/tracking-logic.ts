import type { ApiOrder } from "@/lib/api";

export type Phase = { key: string; label: string; time: Date | null };

// How many of the four phases an order has reached. Every status past "placed" stamps its phases with the
// last update time; pending and cancelled orders show only "placed" (cancelled relies on the banner).
const PHASES_REACHED: Record<ApiOrder["status"], number> = {
  PENDING: 1,
  PAID: 2,
  SHIPPED: 3,
  COMPLETED: 4,
  CANCELLED: 1,
};

export function buildPhases(order: ApiOrder): { phases: Phase[]; currentIndex: number } {
  const placedAt = new Date(order.createdAt);
  const updatedAt = new Date(order.updatedAt);
  const reached = PHASES_REACHED[order.status] ?? 1;
  const labels = [
    { key: "placed", label: "Order Placed" },
    { key: "preparing", label: "Preparing" },
    { key: "out", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" },
  ];
  const phases: Phase[] = labels.map((p, i) => {
    if (i === 0) return { ...p, time: placedAt };
    return { ...p, time: i < reached ? updatedAt : null };
  });
  return { phases, currentIndex: reached - 1 };
}

export type LookupProblem = { message: string; clearEmail: boolean };

/** Why a lookup cannot even be attempted from the page's inputs (null when it can). */
export function lookupProblem(orderId: string, email: string): LookupProblem | null {
  if (!orderId) return { message: "No Order ID provided.", clearEmail: true };
  if (!email) {
    return { message: "Please re-enter the email used at checkout to track this order.", clearEmail: false };
  }
  if (!/^\d+$/.test(orderId.trim())) return { message: "Order ID must be numeric.", clearEmail: true };
  return null;
}

export const retryHref = (orderId: string) => (/^\d+$/.test(orderId) ? `/track-order?orderId=${orderId}` : "/track-order");

export const sectionLabel = "font-sans text-xs font-medium uppercase tracking-[0.16em] text-stone-dark";
