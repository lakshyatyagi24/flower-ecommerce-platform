"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminApi, AdminOrder, ApiError } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useToast } from "@/components/ui/toast";
import { errorMessage } from "@/lib/error-message";
import { filtersToQuery, hasActiveFilters, initialFilters, OrderFilterState } from "./filters";

export function useOrdersList() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilterState>(() => initialFilters(searchParams.get("attention") ?? ""));
  // Free-text search (order id, name, email, phone). The box updates instantly; the list follows after a pause.
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 350);
  const { addToast } = useToast();

  const reqRef = useRef(0);
  const fetchOrders = useCallback(async () => {
    // Only the latest request may touch state (rapid filter changes / post-save refetch).
    const id = ++reqRef.current;
    setLoading(true);
    try {
      const res = await adminApi.listOrders({ ...filtersToQuery(filters, debouncedSearch), take: 200 });
      if (id !== reqRef.current) return;
      setOrders(res.items);
      setTotal(res.total);
    } catch (err) {
      if (id !== reqRef.current) return;
      if (err instanceof ApiError && err.status === 401) return; // announced by the auth provider
      addToast({ type: "error", title: "Error", description: errorMessage(err, "Failed to load orders") });
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }, [filters, debouncedSearch, addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const setFilter = (key: keyof OrderFilterState, value: string) => setFilters((f) => ({ ...f, [key]: value }));

  return {
    orders,
    total,
    loading,
    filters,
    setFilter,
    searchInput,
    setSearchInput,
    hasFilters: hasActiveFilters(filters, debouncedSearch),
    fetchOrders,
  };
}
