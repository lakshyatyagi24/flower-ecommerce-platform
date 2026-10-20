import type { AdminOrderFilters } from "@/lib/api";
import { ATTENTION_VALUES } from "./constants";

export type OrderFilterState = {
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  attention: string;
  // "" = newest first; "deliveryDate" = upcoming deliveries only (today onward), soonest first.
  sortBy: string;
};

export function initialFilters(attention: string): OrderFilterState {
  return {
    status: "",
    paymentStatus: "",
    paymentMethod: "",
    attention: (ATTENTION_VALUES as readonly string[]).includes(attention) ? attention : "",
    sortBy: "",
  };
}

export function filtersToQuery(filters: OrderFilterState, q: string): AdminOrderFilters {
  return {
    status: filters.status || undefined,
    paymentStatus: filters.paymentStatus || undefined,
    paymentMethod: filters.paymentMethod || undefined,
    attention: filters.attention || undefined,
    sort: filters.sortBy === "deliveryDate" ? "deliveryDate" : undefined,
    q: q || undefined,
  };
}

export function hasActiveFilters(filters: OrderFilterState, search: string): boolean {
  return Object.values(filters).some(Boolean) || !!search;
}
