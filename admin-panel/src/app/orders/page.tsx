"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { adminApi, AdminOrder, ApiError } from "@/lib/api";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

function formatINR(amount: number): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `₹${amount.toFixed(0)}`;
  }
}

function badgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PENDING":
      return "outline";
    case "PAID":
      return "default";
    case "SHIPPED":
      return "secondary";
    case "COMPLETED":
      return "default";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { addToast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listOrders({ status: statusFilter || undefined, take: 200 });
      setOrders(res.items);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load orders";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: number, status: string) => {
    setUpdatingStatus(true);
    try {
      const updated = await adminApi.updateOrderStatus(orderId, status);
      setSelected(updated);
      addToast({ type: "success", title: "Status updated", description: `Order #${orderId} is now ${status}.` });
      fetchOrders();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update";
      addToast({ type: "error", title: "Error", description: message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded text-sm"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">#{o.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{o.customerName ?? "Guest"}</div>
                      <div className="text-xs text-muted-foreground">{o.customerEmail}</div>
                    </TableCell>
                    <TableCell>{o.items.reduce((s, it) => s + it.quantity, 0)} items</TableCell>
                    <TableCell>{formatINR(o.total)}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(o.status)}>{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelected(o)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-1">Customer</h3>
                  <div>{selected.customerName ?? "Guest"}</div>
                  <div className="text-muted-foreground">{selected.customerEmail}</div>
                  {selected.customerPhone && <div className="text-muted-foreground">{selected.customerPhone}</div>}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Shipping</h3>
                  <div className="whitespace-pre-wrap">{selected.shippingAddress}</div>
                  {(selected.city || selected.postalCode) && (
                    <div className="text-muted-foreground">
                      {selected.city}
                      {selected.city && selected.postalCode ? ", " : ""}
                      {selected.postalCode}
                    </div>
                  )}
                </div>
              </div>

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
                    {selected.items.map((it) => (
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

              <div className="flex justify-end text-sm">
                <div className="space-y-1 w-64">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatINR(selected.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{selected.shipping === 0 ? "Free" : formatINR(selected.shipping)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>Total</span>
                    <span>{formatINR(selected.total)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Payment</span>
                    <span>{selected.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {selected.notes && (
                <div>
                  <h3 className="font-semibold mb-1">Customer notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{selected.notes}</p>
                </div>
              )}

              <div className="border-t pt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Update status:</span>
                {STATUSES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={selected.status === s ? "default" : "outline"}
                    disabled={updatingStatus || selected.status === s}
                    onClick={() => handleStatusChange(selected.id, s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
