import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminOrder } from "@/lib/api";
import { OrdersTable } from "./OrdersTable";

type OrdersCardProps = {
  orders: AdminOrder[];
  total: number;
  loading: boolean;
  hasFilters: boolean;
  onView: (order: AdminOrder) => void;
};

function OrdersBody({ orders, loading, hasFilters, onView }: Omit<OrdersCardProps, "total">) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {hasFilters ? "No orders match this search or these filters." : "No orders yet."}
      </p>
    );
  }
  return <OrdersTable orders={orders} onView={onView} />;
}

export function OrdersCard({ orders, total, loading, hasFilters, onView }: OrdersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders ({orders.length})</CardTitle>
        {!loading && total > orders.length && (
          <p className="text-sm text-muted-foreground">
            Showing the first {orders.length} of {total} matching orders. Search or filter to narrow them down.
          </p>
        )}
        <p className="sr-only" role="status">{loading ? "Loading orders" : `${total} ${total === 1 ? "order" : "orders"} found`}</p>
      </CardHeader>
      <CardContent>
        <OrdersBody orders={orders} loading={loading} hasFilters={hasFilters} onView={onView} />
      </CardContent>
    </Card>
  );
}
