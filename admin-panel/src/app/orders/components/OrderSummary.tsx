import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AdminOrder } from "@/lib/api";
import { formatINR } from "@/lib/currency";
import { formatDeliveryDate } from "@/lib/delivery-date";

export function CustomerShipping({ order }: { order: AdminOrder }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <h3 className="font-semibold mb-1">Customer</h3>
        <div>{order.customerName ?? "Guest"}</div>
        <div className="text-muted-foreground">{order.customerEmail}</div>
        {order.customerPhone && <div className="text-muted-foreground">{order.customerPhone}</div>}
      </div>
      <div>
        <h3 className="font-semibold mb-1">Shipping</h3>
        <div className="font-medium">
          Delivery date: {formatDeliveryDate(order.deliveryDate) || "not set (older order)"}
        </div>
        <div className="whitespace-pre-wrap">{order.shippingAddress}</div>
        {(order.city || order.postalCode) && (
          <div className="text-muted-foreground">
            {order.city}
            {order.city && order.postalCode ? ", " : ""}
            {order.postalCode}
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderItemsTable({ items }: { items: AdminOrder["items"] }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">Items</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it) => (
            <TableRow key={it.id}>
              <TableCell>{it.productName}</TableCell>
              <TableCell>{it.quantity}</TableCell>
              <TableCell>{formatINR(it.unitPrice)}</TableCell>
              <TableCell className="text-right">{formatINR(it.unitPrice * it.quantity)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TotalsLine({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="flex justify-between" data-testid={testId}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function OrderTotals({ order }: { order: AdminOrder }) {
  const hasDiscount = !!order.discount && order.discount > 0;
  const hasGst = !!order.gst && order.gst > 0;
  return (
    <div className="flex justify-end text-sm">
      <div className="space-y-1 w-64">
        <TotalsLine label="Subtotal" value={formatINR(order.subtotal)} />
        <TotalsLine label="Shipping" value={order.shipping === 0 ? "Free" : formatINR(order.shipping)} />
        {hasDiscount && (
          <TotalsLine
            label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
            value={`-${formatINR(order.discount as number)}`}
            testId="order-discount"
          />
        )}
        {hasGst && <TotalsLine label="GST" value={formatINR(order.gst as number)} />}
        <div className="flex justify-between font-semibold pt-1 border-t">
          <span>Total</span>
          <span>{formatINR(order.total)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground pt-1">
          <span>Payment</span>
          <span>{order.paymentMethod}</span>
        </div>
      </div>
    </div>
  );
}
