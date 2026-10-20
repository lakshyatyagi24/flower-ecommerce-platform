import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminOrder } from "@/lib/api";
import { formatINR } from "@/lib/currency";
import { formatDeliveryDate } from "@/lib/delivery-date";
import { paymentBadge } from "@/lib/refund-note";
import { badgeVariant } from "../constants";
import { PaymentBadge } from "./PaymentBadge";

const COLUMNS = ["Order ID", "Customer", "Items", "Total", "Status", "Payment", "Tracking", "Date", "Deliver on", "Actions"];

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

function TrackingCell({ order }: { order: AdminOrder }) {
  if (!order.trackingNumber) return <Dash />;
  return (
    <div>
      <div className="font-mono">{order.trackingNumber}</div>
      {order.courierName && <div className="text-muted-foreground">{order.courierName}</div>}
    </div>
  );
}

function OrderRow({ order, onView }: { order: AdminOrder; onView: (order: AdminOrder) => void }) {
  return (
    <TableRow className={paymentBadge(order).attention ? "bg-destructive/10" : undefined}>
      <TableCell className="font-mono">#{order.id}</TableCell>
      <TableCell>
        <div className="font-medium">{order.customerName ?? "Guest"}</div>
        <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
      </TableCell>
      <TableCell>{order.items.reduce((s, it) => s + it.quantity, 0)} items</TableCell>
      <TableCell>{formatINR(order.total)}</TableCell>
      <TableCell>
        <Badge variant={badgeVariant(order.status)}>{order.status}</Badge>
      </TableCell>
      <TableCell>
        <div className="text-xs text-muted-foreground mb-1">
          {order.paymentMethod === "RAZORPAY" ? "Online" : order.paymentMethod}
        </div>
        <PaymentBadge order={order} />
      </TableCell>
      <TableCell className="text-xs">
        <TrackingCell order={order} />
      </TableCell>
      <TableCell className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
      <TableCell className="text-sm whitespace-nowrap">{formatDeliveryDate(order.deliveryDate) || <Dash />}</TableCell>
      <TableCell>
        <Button variant="outline" size="sm" onClick={() => onView(order)}>
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function OrdersTable({ orders, onView }: { orders: AdminOrder[]; onView: (order: AdminOrder) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map((c) => (
            <TableHead key={c}>{c}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <OrderRow key={o.id} order={o} onView={onView} />
        ))}
      </TableBody>
    </Table>
  );
}
