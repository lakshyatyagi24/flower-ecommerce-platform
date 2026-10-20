"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { AdminOrder } from "@/lib/api";
import { OrderDetailsDialog } from "./components/OrderDetailsDialog";
import { OrdersCard } from "./components/OrdersCard";
import { OrdersFilters } from "./components/OrdersFilters";
import { useCopyText } from "./useCopyText";
import { useOrderDetail } from "./useOrderDetail";
import { useOrdersExport } from "./useOrdersExport";
import { useOrdersList } from "./useOrdersList";
import { useRefundPayment } from "./useRefundPayment";

export default function OrdersPage() {
  return (
    <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin" />}>
      <OrdersView />
    </Suspense>
  );
}

function OrdersView() {
  const list = useOrdersList();
  const { exporting, exportCsv } = useOrdersExport(list.filters, list.searchInput, list.setSearchInput);
  const detail = useOrderDetail(list.fetchOrders);
  const refund = useRefundPayment({ selected: detail.selected, setSelected: detail.setSelected, fetchOrders: list.fetchOrders });
  const copyText = useCopyText();

  const openOrder = (order: AdminOrder) => {
    refund.clearPaymentError();
    detail.setSelected(order);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders, tracking and fulfillment notes.</p>
        </div>
      </div>

      <OrdersFilters
        filters={list.filters}
        onFilterChange={list.setFilter}
        searchInput={list.searchInput}
        onSearchChange={list.setSearchInput}
        exporting={exporting}
        onExport={exportCsv}
      />

      <OrdersCard
        orders={list.orders}
        total={list.total}
        loading={list.loading}
        hasFilters={list.hasFilters}
        onView={openOrder}
      />

      <OrderDetailsDialog detail={detail} refund={refund} onCopy={copyText} />
    </div>
  );
}
